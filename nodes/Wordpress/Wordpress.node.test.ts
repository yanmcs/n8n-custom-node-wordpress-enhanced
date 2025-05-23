import { INodeExecutionData, IExecuteFunctions, NodeOperationError } from 'n8n-workflow';
import { Wordpress } from './Wordpress.node';

// Mock IExecuteFunctions
const mockExecuteFunctions = (): IExecuteFunctions => {
	const httpRequest = jest.fn();
	return {
		getNodeParameter: jest.fn(),
		getInputData: jest.fn().mockReturnValue([{ json: {} }]), // Default mock for getInputData
		getCredentials: jest.fn(),
		helpers: {
			httpRequest,
			getBinaryDataBuffer: jest.fn(),
			assertBinaryData: jest.fn(),
		},
		continueOnFail: jest.fn().mockReturnValue(false),
		getNode: jest.fn().mockReturnValue({
			getNodeName: jest.fn().mockReturnValue('Wordpress'),
			getContext: jest.fn().mockReturnValue({}),
			getExecutionId: jest.fn().mockReturnValue('test-execution-id'),
		} as any),
	} as unknown as IExecuteFunctions;
};


describe('Wordpress Node', () => {
	let execFunctions: IExecuteFunctions;
	let wordpressNode: Wordpress;

	beforeEach(() => {
		execFunctions = mockExecuteFunctions();
		wordpressNode = new Wordpress();
	});

	afterEach(() => {
		jest.clearAllMocks();
	});

	describe('Post Resource', () => {
		const mockWordPressCredentials = {
			url: 'https://example.com',
			username: 'testuser',
			password: 'testpassword',
		};

		it('should create a post successfully', async () => {
			// Setup mock parameters
			(execFunctions.getNodeParameter as jest.Mock)
				.mockReturnValueOnce('post') // resource
				.mockReturnValueOnce('create') // operation
				.mockReturnValueOnce('Test Post Title') // title
				.mockReturnValueOnce('<p>Test post content.</p>') // content
				.mockReturnValueOnce('publish') // status
				.mockReturnValueOnce('Test excerpt') // excerpt
				.mockReturnValueOnce('1,2') // categories
				.mockReturnValueOnce('3,4'); // tags

			(execFunctions.getCredentials as jest.Mock).mockResolvedValue(mockWordPressCredentials);

			const mockPostResponse = {
				id: 123,
				title: { rendered: 'Test Post Title' },
				content: { rendered: '<p>Test post content.</p>' },
				status: 'publish',
				excerpt: { rendered: 'Test excerpt' },
				categories: [1, 2],
				tags: [3, 4],
			};
			(execFunctions.helpers.httpRequest as jest.Mock).mockResolvedValue(mockPostResponse);

			// Execute the node
			const result: INodeExecutionData[][] = await wordpressNode.execute.call(execFunctions);

			// Assertions
			expect(result[0][0].json).toEqual(mockPostResponse);
			expect(execFunctions.helpers.httpRequest).toHaveBeenCalledTimes(1);
			expect(execFunctions.helpers.httpRequest).toHaveBeenCalledWith(
				expect.objectContaining({
					method: 'POST',
					baseURL: `${mockWordPressCredentials.url}/wp-json/wp/v2`,
					url: '/posts',
					body: {
						title: 'Test Post Title',
						content: '<p>Test post content.</p>',
						status: 'publish',
						excerpt: 'Test excerpt',
						categories: [1, 2],
						tags: [3, 4],
					},
					headers: expect.objectContaining({
						'Authorization': expect.stringContaining('Basic '),
					}),
				}),
			);
		});

		it('should get a post successfully', async () => {
			const postId = 'test-post-id-123';
			// Setup mock parameters
			(execFunctions.getNodeParameter as jest.Mock)
				.mockReturnValueOnce('post') // resource
				.mockReturnValueOnce('get') // operation
				.mockReturnValueOnce(postId); // postId

			(execFunctions.getCredentials as jest.Mock).mockResolvedValue(mockWordPressCredentials);

			const mockGetResponse = {
				id: postId,
				title: { rendered: 'Fetched Post Title' },
				content: { rendered: '<p>Fetched post content.</p>' },
				status: 'publish',
			};
			(execFunctions.helpers.httpRequest as jest.Mock).mockResolvedValue(mockGetResponse);

			// Execute the node
			const result: INodeExecutionData[][] = await wordpressNode.execute.call(execFunctions);

			// Assertions
			expect(result[0][0].json).toEqual(mockGetResponse);
			expect(execFunctions.helpers.httpRequest).toHaveBeenCalledTimes(1);
			expect(execFunctions.helpers.httpRequest).toHaveBeenCalledWith(
				expect.objectContaining({
					method: 'GET',
					baseURL: `${mockWordPressCredentials.url}/wp-json/wp/v2`,
					url: `/posts/${postId}`,
					headers: expect.objectContaining({
						'Authorization': expect.stringContaining('Basic '),
					}),
				}),
			);
		});

		it('should update a post successfully', async () => {
			const postId = 'test-post-id-456';
			const updatedTitle = 'Updated Test Post Title';
			const updatedStatus = 'draft';

			// Setup mock parameters
			(execFunctions.getNodeParameter as jest.Mock)
				.mockReturnValueOnce('post') // resource
				.mockReturnValueOnce('update') // operation
				.mockReturnValueOnce(postId) // postId
				.mockReturnValueOnce(updatedTitle) // title
				.mockReturnValueOnce(null) // content (not updated)
				.mockReturnValueOnce(updatedStatus) // status
				.mockReturnValueOnce(null) // excerpt (not updated)
				.mockReturnValueOnce(null) // categories (not updated)
				.mockReturnValueOnce(null); // tags (not updated)

			(execFunctions.getCredentials as jest.Mock).mockResolvedValue(mockWordPressCredentials);

			const mockUpdateResponse = {
				id: postId,
				title: { rendered: updatedTitle },
				status: updatedStatus,
				content: { rendered: '<p>Original content, not updated.</p>' }, // Assuming content wasn't updated
			};
			(execFunctions.helpers.httpRequest as jest.Mock).mockResolvedValue(mockUpdateResponse);

			// Execute the node
			const result: INodeExecutionData[][] = await wordpressNode.execute.call(execFunctions);

			// Assertions
			expect(result[0][0].json).toEqual(mockUpdateResponse);
			expect(execFunctions.helpers.httpRequest).toHaveBeenCalledTimes(1);
			expect(execFunctions.helpers.httpRequest).toHaveBeenCalledWith(
				expect.objectContaining({
					method: 'POST', // WordPress API uses POST for updates
					baseURL: `${mockWordPressCredentials.url}/wp-json/wp/v2`,
					url: `/posts/${postId}`,
					body: {
						title: updatedTitle,
						status: updatedStatus,
					}, // Only updated fields
					headers: expect.objectContaining({
						'Authorization': expect.stringContaining('Basic '),
					}),
				}),
			);
		});

		it('should delete a post successfully', async () => {
			const postId = 'test-post-id-789';
			// Setup mock parameters
			(execFunctions.getNodeParameter as jest.Mock)
				.mockReturnValueOnce('post') // resource
				.mockReturnValueOnce('delete') // operation
				.mockReturnValueOnce(postId); // postId

			(execFunctions.getCredentials as jest.Mock).mockResolvedValue(mockWordPressCredentials);

			// WordPress might return the deleted post object (now in trash) or just a success status
			// For this test, we'll mock the node's success message structure
			const mockDeleteResponsePayload = { message: `Post ${postId} deleted successfully (moved to trash).` };
			// The httpRequest itself might return the full post object or a simpler success
			(execFunctions.helpers.httpRequest as jest.Mock).mockResolvedValue({
				id: postId,
				status: 'trash', // Example of what WP might return for a trashed post
			});


			// Execute the node
			const result: INodeExecutionData[][] = await wordpressNode.execute.call(execFunctions);

			// Assertions
			expect(result[0][0].json).toEqual(mockDeleteResponsePayload);
			expect(execFunctions.helpers.httpRequest).toHaveBeenCalledTimes(1);
			expect(execFunctions.helpers.httpRequest).toHaveBeenCalledWith(
				expect.objectContaining({
					method: 'DELETE',
					baseURL: `${mockWordPressCredentials.url}/wp-json/wp/v2`,
					url: `/posts/${postId}`,
					headers: expect.objectContaining({
						'Authorization': expect.stringContaining('Basic '),
					}),
				}),
			);
		});
	});

	describe('Media Resource', () => {
		const mockWordPressCredentials = {
			url: 'https://example.com',
			username: 'testuser',
			password: 'testpassword',
		};
		const binaryPropertyName = 'data'; // The property name for binary data

		it('should upload a media file successfully', async () => {
			const mockMediaResponse = {
				id: 789,
				link: 'https://example.com/wp-content/uploads/2023/01/test.jpg',
				title: { rendered: 'Test Media Title' },
				alt_text: 'Test Alt Text',
			};

			// Setup mock parameters
			(execFunctions.getNodeParameter as jest.Mock)
				.mockReturnValueOnce('media') // resource
				.mockReturnValueOnce('upload') // operation
				.mockReturnValueOnce(binaryPropertyName) // file property name
				.mockReturnValueOnce('Test Media Title') // title
				.mockReturnValueOnce('Test Alt Text') // altText
				.mockReturnValueOnce('') // caption
				.mockReturnValueOnce(''); // description_media

			(execFunctions.getCredentials as jest.Mock).mockResolvedValue(mockWordPressCredentials);

			// Mock binary data helpers
			(execFunctions.helpers.getBinaryDataBuffer as jest.Mock).mockResolvedValue(Buffer.from('test file content'));
			(execFunctions.helpers.assertBinaryData as jest.Mock).mockReturnValue({
				fileName: 'test.jpg',
				mimeType: 'image/jpeg',
			});

			// Mock httpRequest for binary upload. wordpressApiRequestBinary expects a full response object.
			(execFunctions.helpers.httpRequest as jest.Mock).mockResolvedValue({
				body: Buffer.from(JSON.stringify(mockMediaResponse)), // wordpressApiRequestBinary parses this
				headers: { 'content-type': 'application/json' },
				statusCode: 201, // Created
			});


			// Execute the node
			const result: INodeExecutionData[][] = await wordpressNode.execute.call(execFunctions);

			// Assertions
			expect(result[0][0].json).toEqual(mockMediaResponse);
			expect(execFunctions.helpers.httpRequest).toHaveBeenCalledTimes(1);
			const httpRequestCall = (execFunctions.helpers.httpRequest as jest.Mock).mock.calls[0][0];
			expect(httpRequestCall.method).toBe('POST');
			expect(httpRequestCall.baseURL).toBe(`${mockWordPressCredentials.url}/wp-json/wp/v2`);
			expect(httpRequestCall.url).toBe('/media');
			expect(httpRequestCall.body).toBeInstanceOf(Object); // FormData-like structure
			expect(httpRequestCall.body.file).toBeDefined();
			expect(httpRequestCall.body.file.options.filename).toBe('test.jpg');
			expect(httpRequestCall.body.file.options.contentType).toBe('image/jpeg');
			expect(httpRequestCall.body.title).toBe('Test Media Title');
			expect(httpRequestCall.body.alt_text).toBe('Test Alt Text');
			expect(httpRequestCall.headers).toEqual(expect.objectContaining({
				'Authorization': expect.stringContaining('Basic '),
			}));
			expect(httpRequestCall.json).toBe(false); // As set in wordpressApiRequestBinary
			expect(httpRequestCall.encoding).toBe('arraybuffer'); // As set in wordpressApiRequestBinary
		});


		it('should get a media item successfully', async () => {
			const mediaId = 'media-id-123';
			(execFunctions.getNodeParameter as jest.Mock)
				.mockReturnValueOnce('media')
				.mockReturnValueOnce('get')
				.mockReturnValueOnce(mediaId);
			(execFunctions.getCredentials as jest.Mock).mockResolvedValue(mockWordPressCredentials);

			const mockGetResponse = { id: mediaId, title: { rendered: 'Fetched Media' } };
			(execFunctions.helpers.httpRequest as jest.Mock).mockResolvedValue(mockGetResponse);

			const result = await wordpressNode.execute.call(execFunctions);
			expect(result[0][0].json).toEqual(mockGetResponse);
			expect(execFunctions.helpers.httpRequest).toHaveBeenCalledWith(expect.objectContaining({
				method: 'GET',
				url: `/media/${mediaId}`,
			}));
		});

		it('should update a media item successfully', async () => {
			const mediaId = 'media-id-456';
			const updatedTitle = 'Updated Media Title';
			const updatedAltText = 'Updated Alt Text';

			(execFunctions.getNodeParameter as jest.Mock)
				.mockReturnValueOnce('media')
				.mockReturnValueOnce('update')
				.mockReturnValueOnce(mediaId)
				.mockReturnValueOnce(updatedTitle) // title
				.mockReturnValueOnce(updatedAltText) // altText
				.mockReturnValueOnce(null) // caption
				.mockReturnValueOnce(null); // description_media

			(execFunctions.getCredentials as jest.Mock).mockResolvedValue(mockWordPressCredentials);

			const mockUpdateResponse = { id: mediaId, title: { rendered: updatedTitle }, alt_text: updatedAltText };
			(execFunctions.helpers.httpRequest as jest.Mock).mockResolvedValue(mockUpdateResponse);

			const result = await wordpressNode.execute.call(execFunctions);
			expect(result[0][0].json).toEqual(mockUpdateResponse);
			expect(execFunctions.helpers.httpRequest).toHaveBeenCalledWith(expect.objectContaining({
				method: 'POST',
				url: `/media/${mediaId}`,
				body: { title: updatedTitle, alt_text: updatedAltText },
			}));
		});

		it('should delete a media item successfully', async () => {
			const mediaId = 'media-id-789';
			(execFunctions.getNodeParameter as jest.Mock)
				.mockReturnValueOnce('media')
				.mockReturnValueOnce('delete')
				.mockReturnValueOnce(mediaId);
			(execFunctions.getCredentials as jest.Mock).mockResolvedValue(mockWordPressCredentials);

			// wordpressApiRequest for DELETE doesn't typically return a body, just status.
			// The node itself crafts the success message.
			(execFunctions.helpers.httpRequest as jest.Mock).mockResolvedValue({}); // Empty object for successful no-content like response

			const result = await wordpressNode.execute.call(execFunctions);
			expect(result[0][0].json).toEqual({ message: `Media item ${mediaId} deleted permanently.` });
			expect(execFunctions.helpers.httpRequest).toHaveBeenCalledWith(expect.objectContaining({
				method: 'DELETE',
				url: `/media/${mediaId}?force=true`,
			}));
		});
	});
	// TODO: Add describe blocks for Custom Post Type Resource
});
