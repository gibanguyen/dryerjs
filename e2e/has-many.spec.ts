import { TestServer } from './test-server';
import { Color, Image, Product, Tag, Variant, Comment, Store } from '../src/models';

const server = TestServer.init({
  definitions: [Store, Product, Tag, Variant, Image, Color, Comment],
});

const preExistingStores: Store[] = [];

describe('Has many works', () => {
  beforeAll(async () => {
    await server.start();
  });

  it('Create product without image', async () => {
    const { createProduct } = await server.makeSuccessRequest({
      query: `
        mutation CreateProduct($input: CreateProductInput!) {
          createProduct(input: $input) {
            id
            name
            variants {
              id
              name 
              comments {
                id
                content
              }
              product {
                name
              }
            }
            paginateVariants {
              docs {
                name
              }
            }
          }
        }
      `,
      variables: {
        input: {
          name: 'Awesome product',
          variants: [
            {
              name: 'Awesome variant',
              comments: [{ content: 'A' }, { content: 'B' }],
            },
            {
              name: 'Awesome variant 2',
            },
          ],
        },
      },
    });

    expect(createProduct.paginateVariants.docs).toHaveLength(2);
    expect(createProduct.variants).toHaveLength(2);
    expect(createProduct.variants).toEqual([
      {
        id: expect.any(String),
        name: 'Awesome variant',
        comments: [
          {
            id: expect.any(String),
            content: 'A',
          },
          {
            id: expect.any(String),
            content: 'B',
          },
        ],
        product: { name: 'Awesome product' },
      },
      {
        id: expect.any(String),
        name: 'Awesome variant 2',
        comments: [],
        product: { name: 'Awesome product' },
      },
    ]);
  });

  it('Cannot create product from store', async () => {
    const response = await server.makeFailRequest({
      query: `
        mutation CreateStore($input: CreateStoreInput!) {
          createStore(input: $input) {
            id
            name
            products {
              name
              id
            }
          }
        }
      `,
      variables: {
        input: {
          name: 'Awesome store',
          products: [{ name: 'Awesome product' }],
        },
      },
    });

    expect(response[0].extensions.code).toEqual('GRAPHQL_VALIDATION_FAILED');
  });

  it('Cannot get all products in store', async () => {
    const { createStore } = await server.makeSuccessRequest({
      query: `
        mutation CreateStore($input: CreateStoreInput!) {
          createStore(input: $input) {
            id
            name
          }
        }
      `,
      variables: {
        input: {
          name: 'Awesome store',
        },
      },
    });
    preExistingStores.push(createStore);

    const response = await server.makeFailRequest({
      query: `
        query Query($storeId: ObjectId!) {
          store(id: $storeId) {
            id
            name
            products {
              id
              name
            }
          }
        }
      `,
      variables: {
        storeId: preExistingStores.map((store) => store.id),
      },
    });

    expect(response[0].extensions.code).toEqual('GRAPHQL_VALIDATION_FAILED');
  });

  it('Cannot paginate product in store', async () => {
    const response = await server.makeFailRequest({
      query: `
        query Query($storeId: ObjectId!) {
          store(id: $storeId) {
            id
            name
            paginateProducts {
              page
              totalDocs
              totalPages
            }
          }
        }
      `,
      variables: {
        storeId: preExistingStores.map((store) => store.id),
      },
    });

    expect(response[0].extensions.code).toEqual('GRAPHQL_VALIDATION_FAILED');
  });

  afterAll(async () => {
    await server.stop();
  });
});
