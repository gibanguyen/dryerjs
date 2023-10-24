import { TestServer } from './test-server';
import { Tag } from '../src/models';

const server = TestServer.init({
  definitions: [Tag],
});

describe('Simple CRUD works', () => {
  beforeAll(async () => {
    await server.start();
  });

  it('Create tags', async () => {
    const names = ['70s', '80s', '90s'];
    for (const name of names) {
      await server.makeSuccessRequest({
        query: `
          mutation CreateTag($input: CreateTagInput!) {
            createTag(input: $input) {
              id
              name
            }
          }
        `,
        variables: {
          input: {
            name,
          },
        },
      });
    }
  });

  let allTags: Tag[] = [];

  it('Get all tags', async () => {
    const response = await server.makeSuccessRequest({
      query: `
      {
        allTags {
          id
          name
        }
      }
      `,
    });
    allTags = response.allTags;
    expect(allTags).toEqual([
      { id: expect.any(String), name: '70s' },
      { id: expect.any(String), name: '80s' },
      { id: expect.any(String), name: '90s' },
    ]);
  });

  it('Get one tag', async () => {
    const response = await server.makeSuccessRequest({
      query: `
      query GetTag($id: ID!) {
        tag(id: $id) {
          id
          name
        }
      }
      `,
      variables: {
        id: allTags[0].id,
      },
    });
    expect(response.tag.name).toEqual(allTags[0].name);
  });

  it('Update one tag', async () => {
    // TODO: update test when update is implemented
    await server.makeFailRequest({
      query: `
      mutation UpdateTag($input: UpdateTagInput!) {
        updateTag(input: $input) {
          id
          name
        }
      }
      `,
      variables: {
        input: {
          id: allTags[0].id,
          name: '70s',
        },
      },
      errorMessageMustContains: 'Not implemented yet',
    });
  });

  it('Remove one tag and ensure it is gone', async () => {
    const response = await server.makeSuccessRequest({
      query: `
      mutation RemoveTag($id: ID!) {
        removeTag(id: $id) {
          success
        }
      }
      `,
      variables: {
        id: allTags[0].id,
      },
    });
    expect(response.removeTag.success).toEqual(true);

    // Try to fetch the removed tag by its ID
    await server.makeFailRequest({
      query: `
      query GetTag($id: ID!) {
        tag(id: $id) {
          name
        }
      }
      `,
      variables: {
        id: allTags[0].id,
      },
      errorMessageMustContains: `No Tag found with ID: ${allTags[0].id}`,
    });
  });

  afterAll(async () => {
    await server.stop();
  });
});