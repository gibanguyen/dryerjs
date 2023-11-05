import { TestServer } from './test-server';
import { Tag } from '../src/models/product';

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

  it('paginate tags', async () => {
    const { paginateTags } = await server.makeSuccessRequest({
      query: `
      {
        paginateTags {
          docs {
            id
            name
          }
          totalDocs
          page
        }
      }
      `,
    });
    expect(paginateTags).toEqual({
      docs: [
        { id: expect.any(String), name: '70s' },
        { id: expect.any(String), name: '80s' },
        { id: expect.any(String), name: '90s' },
      ],
      totalDocs: 3,
      page: 1,
    });
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
    const response = await server.makeSuccessRequest({
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
          name: '60s',
        },
      },
    });
    expect(response.updateTag.name).toEqual('60s');
  });

  it('Update not found tag', async () => {
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
          id: '000000000000000000000000',
          name: '80s',
        },
      },
      errorMessageMustContains: 'No Tag found with ID: 000000000000000000000000',
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

  it('Remove not found tag', async () => {
    await server.makeFailRequest({
      query: `
      mutation RemoveTag($id: ID!) {
        removeTag(id: $id) {
          success
        }
      }
      `,
      variables: {
        id: '000000000000000000000000',
      },
      errorMessageMustContains: 'No Tag found with ID: 000000000000000000000000',
    });
  });

  it('Get all Tags with sort', async () => {
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
          name: '70s',
        },
      },
    });

    const response = await server.makeSuccessRequest({
      query: `
        query AllTags($sort : TagSort) {
          allTags(sort: $sort) {
            id
            name
          }
        }
      `,
      variables: {
        sort: { name: 'DESC' },
      },
    });
    expect(response).toEqual({
      allTags: [
        { id: expect.any(String), name: '90s' },
        { id: expect.any(String), name: '80s' },
        { id: expect.any(String), name: '70s' },
      ],
    });
  });

  it('Get all Tags with filter', async () => {
    const response = await server.makeSuccessRequest({
      query: `
        query AllTags($filter : TagFilter) {
          allTags(filter: $filter) {
            id
            name
          }
        }
      `,
      variables: {
        filter: { name: { all: '80s' } },
      },
    });
    expect(response).toEqual({
      allTags: [{ id: expect.any(String), name: '80s' }],
    });
  });

  afterAll(async () => {
    await server.stop();
  });
});
