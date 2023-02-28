import { Trigger } from "@trigger.dev/sdk";
import * as github from "@trigger.dev/github";
import * as notion from "@trigger.dev/notion";

const repo =
  process.env.GITHUB_REPOSITORY ?? "triggerdotdev/github-issues-to-notion";
//you can find the database ID in the URL of your Notion database, but you must add dashes in the format 8-4-4-4-12
//e.g. https://www.notion.so/triggerdotdev/Notion-test-page-9257302b0758480ebef110889636f107?pvs=4#7953d4fb90724da89d9df4ad68d5e78a
//becomes 9257302b-0758-480e-bef1-10889636f107
const notionDatabaseId =
  process.env.NOTION_DATABASE_ID ?? "12345678-1234-1234-1234-123456789012";

new Trigger({
  // Give your Trigger a stable ID
  id: "github-issues-to-notion",
  name: "New GitHub issues are added to your Notion database",
  // This will register a webhook with the repo
  // and trigger whenever a new issue is created or modified
  on: github.events.issueEvent({
    repo,
  }),
  // The run function will get called once per "issue" event
  // See https://docs.trigger.dev/integrations/apis/github/events/issues
  run: async (event, ctx) => {
    //we only want to act when a new issue is opened
    if (event.action !== "opened") return;

    //a row in a Notion database is added using the createPage API and setting the parent to be the database
    await notion.createPage("create-issue", {
      parent: {
        database_id: notionDatabaseId,
      },
      properties: {
        title: {
          title: [
            {
              text: {
                content: event.issue.title,
              },
            },
          ],
        },
        GitHub: {
          url: event.issue.html_url,
        },
        Assignees: {
          multi_select: event.issue.assignees.map((assignee) => ({
            name: assignee.login,
          })),
        },
        Labels: {
          multi_select:
            event.issue.labels?.map((label) => ({
              name: label.name,
            })) ?? [],
        },
      },
      children: [
        {
          object: "block",
          type: "paragraph",
          paragraph: {
            rich_text: [
              {
                type: "text",
                text: {
                  content: event.issue.body ?? "No description provided",
                },
              },
            ],
          },
        },
      ],
    });
  },
}).listen();
