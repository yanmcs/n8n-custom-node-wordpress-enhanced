import type {
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
	ICredentialData,
	NodeOperationError,
} from 'n8n-workflow';
import { NodeConnectionType } from 'n8n-workflow';

// Define an interface for the WordPress API credentials
interface IWordpressApiCredentials extends ICredentialData {
	url: string;
	username?: string;
	password?: string; // This can be a user password or an application password
}

export class Wordpress implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'WordPress',
		name: 'wordpress',
		// eslint-disable-next-line n8n-nodes-base/node-class-description-icon-not-svg
		icon: 'file:wordpress.svg', // Reference to the .svg file
		group: ['input'],
		version: 1,
		subtitle: '={{$parameter["operation"] + ": " + $parameter["resource"]}}',
		description: 'Interact with WordPress API',
		defaults: {
			name: 'WordPress',
		},
		inputs: [NodeConnectionType.Main],
		outputs: [NodeConnectionType.Main],
		credentials: [
			{
				name: 'wordpressApi',
				required: true,
			},
		],
		properties: [
			// Resource selector
			{
				displayName: 'Resource',
				name: 'resource',
				type: 'options',
				noDataExpression: true,
				options: [
					{
						name: 'Post',
						value: 'post',
					},
					{
						name: 'Media',
						value: 'media',
					},
					{
						name: 'Custom Post Type',
						value: 'customPostType',
					},
					// TODO: Add other resources like 'page', 'comment', 'category', 'tag', 'user'
				],
				default: 'post',
				description: 'The resource to operate on.',
			},
			// Post Type Slug (for Custom Post Type)
			{
				displayName: 'Post Type Slug',
				name: 'postTypeSlug',
				type: 'string',
				default: '',
				required: true,
				displayOptions: {
					show: {
						resource: ['customPostType'],
					},
				},
				placeholder: 'e.g., movie, product',
				description: 'The slug of the custom post type.',
			},
			// Operation selector
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: {
					show: {
						resource: [
							'post',
						],
					},
				},
				options: [
					{
						name: 'Create',
						value: 'create',
						action: 'Create a post',
					},
					{
						name: 'Delete',
						value: 'delete',
						action: 'Delete a post',
					},
					{
						name: 'Get',
						value: 'get',
						action: 'Get a post',
					},
					{
						name: 'Get All',
						value: 'getAll',
						action: 'Get all posts',
					},
					{
						name: 'Update',
						value: 'update',
						action: 'Update a post',
					},
				],
				default: 'getAll',
				description: 'The operation to perform.',
			},
			// Operation selector for Media
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: {
					show: {
						resource: [
							'media',
						],
					},
				},
				options: [
					{
						name: 'Upload',
						value: 'upload',
						action: 'Upload a media file',
					},
					{
						name: 'Get',
						value: 'get',
						action: 'Get a media item',
					},
					{
						name: 'Get All',
						value: 'getAll',
						action: 'Get all media items',
					},
					{
						name: 'Delete',
						value: 'delete',
						action: 'Delete a media item',
					},
					{
						name: 'Update',
						value: 'update',
						action: 'Update a media item',
					},
				],
				default: 'getAll',
				description: 'The operation to perform.',
			},
			// Operation selector for Custom Post Type
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: {
					show: {
						resource: [
							'customPostType',
						],
					},
				},
				options: [
					{
						name: 'Create',
						value: 'create',
						action: 'Create a custom post type item',
					},
					{
						name: 'Delete',
						value: 'delete',
						action: 'Delete a custom post type item',
					},
					{
						name: 'Get',
						value: 'get',
						action: 'Get a custom post type item',
					},
					{
						name: 'Get All',
						value: 'getAll',
						action: 'Get all custom post type items',
					},
					{
						name: 'Update',
						value: 'update',
						action: 'Update a custom post type item',
					},
				],
				default: 'getAll',
				description: 'The operation to perform.',
			},
			// Fields for Post resource operations
			// Post ID (for Get, Update, Delete)
			{
				displayName: 'Post ID',
				name: 'postId',
				type: 'string',
				default: '',
				required: true,
				displayOptions: {
					show: {
						resource: ['post'],
						operation: ['get', 'update', 'delete'],
					},
				},
				description: 'The ID of the post.',
			},
			// Title (for Create, Update)
			{
				displayName: 'Title',
				name: 'title',
				type: 'string',
				default: '',
				displayOptions: {
					show: {
						resource: ['post'],
						operation: ['create', 'update'],
					},
				},
				description: 'The title of the post.',
			},
			// Content (for Create, Update)
			{
				displayName: 'Content',
				name: 'content',
				type: 'string',
				typeOptions: {
					alwaysOpenEditWindow: true,
				},
				default: '',
				displayOptions: {
					show: {
						resource: ['post'],
						operation: ['create', 'update'],
					},
				},
				description: 'The content of the post.',
			},
			// Status (for Create, Update)
			{
				displayName: 'Status',
				name: 'status',
				type: 'options',
				options: [
					{ name: 'Publish', value: 'publish' },
					{ name: 'Future', value: 'future' },
					{ name: 'Draft', value: 'draft' },
					{ name: 'Pending Review', value: 'pending' },
					{ name: 'Private', value: 'private' },
				],
				default: 'publish',
				displayOptions: {
					show: {
						resource: ['post'],
						operation: ['create', 'update'],
					},
				},
				description: 'The status of the post.',
			},
			// Excerpt (for Create, Update)
			{
				displayName: 'Excerpt',
				name: 'excerpt',
				type: 'string',
				typeOptions: {
					alwaysOpenEditWindow: true,
				},
				default: '',
				displayOptions: {
					show: {
						resource: ['post'],
						operation: ['create', 'update'],
					},
				},
				description: 'The excerpt of the post.',
			},
			// Categories (for Create, Update) - Comma-separated string of category IDs or names
			{
				displayName: 'Categories',
				name: 'categories',
				type: 'string',
				default: '',
				displayOptions: {
					show: {
						resource: ['post'],
						operation: ['create', 'update'],
					},
				},
				placeholder: 'e.g., News,Updates or 1,2',
				description: 'Comma-separated list of category names or IDs. WordPress will create categories that do not exist if you use names.',
			},
			// Tags (for Create, Update) - Comma-separated string of tag IDs or names
			{
				displayName: 'Tags',
				name: 'tags',
				type: 'string',
				default: '',
				displayOptions: {
					show: {
						resource: ['post'],
						operation: ['create', 'update'],
					},
				},
				placeholder: 'e.g., Technology,Release or 3,4',
				description: 'Comma-separated list of tag names or IDs. WordPress will create tags that do not exist if you use names.',
			},
			// TODO: Add fields for 'getAll' operation for Post (e.g., pagination, filtering by status, category, tag)

			// Fields for Media resource operations
			// Media ID (for Get, Update, Delete)
			{
				displayName: 'Media ID',
				name: 'mediaId',
				type: 'string',
				default: '',
				required: true,
				displayOptions: {
					show: {
						resource: ['media'],
						operation: ['get', 'update', 'delete'],
					},
				},
				description: 'The ID of the media item.',
			},
			// File (for Upload)
			{
				displayName: 'File',
				name: 'file',
				type: 'string',
				default: '',
				required: true,
				displayOptions: {
					show: {
						resource: ['media'],
						operation: ['upload'],
					},
				},
				typeOptions: {
					fileBinary: true, // Corrected property name
				},
				description: 'The file to upload. Select a binary property that contains the file data.',
			},
			// Title (for Upload, Update)
			{
				displayName: 'Title',
				name: 'title',
				type: 'string',
				default: '',
				displayOptions: {
					show: {
						resource: ['media'],
						operation: ['upload', 'update'],
					},
				},
				description: 'The title of the media item.',
			},
			// Alt Text (for Upload, Update)
			{
				displayName: 'Alt Text',
				name: 'altText',
				type: 'string',
				default: '',
				displayOptions: {
					show: {
						resource: ['media'],
						operation: ['upload', 'update'],
					},
				},
				description: 'The alt text for the media item (important for accessibility).',
			},
			// Caption (for Upload, Update)
			{
				displayName: 'Caption',
				name: 'caption',
				type: 'string',
				typeOptions: {
					alwaysOpenEditWindow: true,
				},
				default: '',
				displayOptions: {
					show: {
						resource: ['media'],
						operation: ['upload', 'update'],
					},
				},
				description: 'The caption for the media item.',
			},
			// Description (for Upload, Update)
			{
				displayName: 'Description',
				name: 'description_media', // Using a different name to avoid conflict with node description
				type: 'string',
				typeOptions: {
					alwaysOpenEditWindow: true,
				},
				default: '',
				displayOptions: {
					show: {
						resource: ['media'],
						operation: ['upload', 'update'],
					},
				},
				description: 'The description of the media item.',
			},
			// TODO: Add fields for 'getAll' operation for Media (e.g., pagination, filtering by type)

			// Fields for Custom Post Type resource operations
			// These fields are very similar to the 'Post' resource fields.
			// Post ID (for Get, Update, Delete - Custom Post Type)
			{
				displayName: 'Post ID',
				name: 'postId', // Re-using postId, context given by resource selection
				type: 'string',
				default: '',
				required: true,
				displayOptions: {
					show: {
						resource: ['customPostType'],
						operation: ['get', 'update', 'delete'],
					},
				},
				description: 'The ID of the custom post type item.',
			},
			// Title (for Create, Update - Custom Post Type)
			{
				displayName: 'Title',
				name: 'title', // Re-using title
				type: 'string',
				default: '',
				displayOptions: {
					show: {
						resource: ['customPostType'],
						operation: ['create', 'update'],
					},
				},
				description: 'The title of the custom post type item.',
			},
			// Content (for Create, Update - Custom Post Type)
			{
				displayName: 'Content',
				name: 'content', // Re-using content
				type: 'string',
				typeOptions: {
					alwaysOpenEditWindow: true,
				},
				default: '',
				displayOptions: {
					show: {
						resource: ['customPostType'],
						operation: ['create', 'update'],
					},
				},
				description: 'The content of the custom post type item.',
			},
			// Status (for Create, Update - Custom Post Type)
			{
				displayName: 'Status',
				name: 'status', // Re-using status
				type: 'options',
				options: [
					{ name: 'Publish', value: 'publish' },
					{ name: 'Future', value: 'future' },
					{ name: 'Draft', value: 'draft' },
					{ name: 'Pending Review', value: 'pending' },
					{ name: 'Private', value: 'private' },
				],
				default: 'publish',
				displayOptions: {
					show: {
						resource: ['customPostType'],
						operation: ['create', 'update'],
					},
				},
				description: 'The status of the custom post type item.',
			},
			// Excerpt (for Create, Update - Custom Post Type)
			{
				displayName: 'Excerpt',
				name: 'excerpt', // Re-using excerpt
				type: 'string',
				typeOptions: {
					alwaysOpenEditWindow: true,
				},
				default: '',
				displayOptions: {
					show: {
						resource: ['customPostType'],
						operation: ['create', 'update'],
					},
				},
				description: 'The excerpt of the custom post type item.',
			},
			// Custom Fields (for Create, Update - Custom Post Type)
			{
				displayName: 'Custom Fields',
				name: 'customFields',
				type: 'fixedCollection',
				typeOptions: {
					multipleValues: true,
				},
				default: {},
				placeholder: 'Add Custom Field',
				displayOptions: {
					show: {
						resource: ['customPostType'],
						operation: ['create', 'update'],
					},
				},
				properties: [
					{
						name: 'key',
						displayName: 'Key',
						type: 'string',
						default: '',
						description: 'Name of the custom field (meta key).',
					},
					{
						name: 'value',
						displayName: 'Value',
						type: 'string',
						default: '',
						description: 'Value of the custom field (meta value).',
					},
				],
				description: 'Custom fields (metadata) for the custom post type item.',
			},
			// TODO: Add fields for 'getAll' operation for Custom Post Types (e.g., pagination, filtering)
		],
	};

	// Centralized API request helper
	private async wordpressApiRequest(
		this: IExecuteFunctions,
		method: 'GET' | 'POST' | 'PUT' | 'DELETE',
		endpoint: string,
		body: object = {},
		// qs: object = {}, // Query string parameters
		credentials?: IWordpressApiCredentials, // Make credentials optional as they might be passed directly
	): Promise<any> {
		credentials = credentials ?? await this.getCredentials('wordpressApi') as IWordpressApiCredentials;
		const { url, username, password } = credentials;

		if (!url) {
			throw new NodeOperationError(this.getNode(), 'WordPress Site URL is not set in credentials!', { itemIndex: 0 });
		}

		const options: any = {
			method,
			baseURL: `${url.replace(/\/$/, '')}/wp-json/wp/v2`, // Ensure no trailing slash and add API base path
			url: endpoint,
			headers: {
				'Accept': 'application/json',
				'Content-Type': 'application/json',
			},
			// qs,
			json: true, // Automatically stringifies the body to JSON
		};

		if (body && Object.keys(body).length > 0) {
			options.body = body;
		}

		if (username && password) {
			options.auth = {
				user: username,
				pass: password,
			};
			// WordPress Application Passwords are used in the password field with any username (or the actual username)
			// Basic Auth using username and actual user password might require a plugin on WordPress side.
			// This setup assumes Application Passwords or a correctly configured Basic Auth.
			options.headers['Authorization'] = `Basic ${Buffer.from(`${username}:${password}`).toString('base64')}`;
		}


		try {
			return await this.helpers.httpRequest(options);
		} catch (error) {
			// Attempt to parse error response from WordPress if available
			if (error.response && error.response.data && error.response.data.message) {
				throw new NodeOperationError(this.getNode(), `WordPress API Error: ${error.response.data.message}`, { itemIndex: 0, cause: error });
			}
			throw new NodeOperationError(this.getNode(), error, { itemIndex: 0 });
		}
	}

	// Handler for Custom Post Type -> Create
	private async executeCustomPostTypeCreate(this: IExecuteFunctions, itemIndex: number): Promise<INodeExecutionData> {
		const postTypeSlug = this.getNodeParameter('postTypeSlug', itemIndex, '') as string;
		if (!postTypeSlug) {
			throw new NodeOperationError(this.getNode(), 'Post Type Slug is required for Custom Post Type operations.', { itemIndex });
		}

		const title = this.getNodeParameter('title', itemIndex, '') as string;
		const content = this.getNodeParameter('content', itemIndex, '') as string;
		const status = this.getNodeParameter('status', itemIndex, 'publish') as string;
		const excerpt = this.getNodeParameter('excerpt', itemIndex, '') as string;
		const customFieldsData = this.getNodeParameter('customFields', itemIndex, { properties: [] }) as { properties: Array<{ key?: string; value?: string }> };

		const body: any = {
			title,
			content,
			status,
		};
		if (excerpt) body.excerpt = excerpt;

		if (customFieldsData.properties && customFieldsData.properties.length > 0) {
			body.meta = {};
			for (const field of customFieldsData.properties) {
				if (field.key) { // Ensure key is not empty or undefined
					body.meta[field.key] = field.value ?? '';
				}
			}
		}

		try {
			const response = await this.wordpressApiRequest('POST', `/${postTypeSlug.trim()}`, body);
			return { json: response, pairedItem: { itemIndex } };
		} catch (error) {
			if (this.continueOnFail()) {
				return { json: { error: error.message }, pairedItem: { itemIndex }, error };
			}
			throw error;
		}
	}

	// Handler for Custom Post Type -> Get
	private async executeCustomPostTypeGet(this: IExecuteFunctions, itemIndex: number): Promise<INodeExecutionData> {
		const postTypeSlug = this.getNodeParameter('postTypeSlug', itemIndex, '') as string;
		if (!postTypeSlug) {
			throw new NodeOperationError(this.getNode(), 'Post Type Slug is required.', { itemIndex });
		}
		const postId = this.getNodeParameter('postId', itemIndex, '') as string;
		if (!postId) {
			throw new NodeOperationError(this.getNode(), 'Post ID is required for Get operation.', { itemIndex });
		}

		try {
			const response = await this.wordpressApiRequest('GET', `/${postTypeSlug.trim()}/${postId}`);
			return { json: response, pairedItem: { itemIndex } };
		} catch (error) {
			if (this.continueOnFail()) {
				return { json: { error: error.message }, pairedItem: { itemIndex }, error };
			}
			throw error;
		}
	}

	// Handler for Custom Post Type -> Update
	private async executeCustomPostTypeUpdate(this: IExecuteFunctions, itemIndex: number): Promise<INodeExecutionData> {
		const postTypeSlug = this.getNodeParameter('postTypeSlug', itemIndex, '') as string;
		if (!postTypeSlug) {
			throw new NodeOperationError(this.getNode(), 'Post Type Slug is required.', { itemIndex });
		}
		const postId = this.getNodeParameter('postId', itemIndex, '') as string;
		if (!postId) {
			throw new NodeOperationError(this.getNode(), 'Post ID is required for Update operation.', { itemIndex });
		}

		const body: any = {};
		const title = this.getNodeParameter('title', itemIndex, null) as string | null;
		const content = this.getNodeParameter('content', itemIndex, null) as string | null;
		const status = this.getNodeParameter('status', itemIndex, null) as string | null;
		const excerpt = this.getNodeParameter('excerpt', itemIndex, null) as string | null;
		const customFieldsData = this.getNodeParameter('customFields', itemIndex, null) as { properties: Array<{ key?: string; value?: string }> } | null;


		if (title !== null) body.title = title;
		if (content !== null) body.content = content;
		if (status !== null) body.status = status;
		if (excerpt !== null) body.excerpt = excerpt;

		if (customFieldsData && customFieldsData.properties && customFieldsData.properties.length > 0) {
			body.meta = {};
			for (const field of customFieldsData.properties) {
				if (field.key) {
					body.meta[field.key] = field.value ?? '';
				}
			}
		}

		if (Object.keys(body).length === 0) {
			const currentItem = this.getInputData(itemIndex)[0].json;
			return { json: { message: "No fields provided to update for custom post type.", item: currentItem }, pairedItem: { itemIndex } };
		}

		try {
			const response = await this.wordpressApiRequest('POST', `/${postTypeSlug.trim()}/${postId}`, body);
			return { json: response, pairedItem: { itemIndex } };
		} catch (error) {
			if (this.continueOnFail()) {
				return { json: { error: error.message }, pairedItem: { itemIndex }, error };
			}
			throw error;
		}
	}

	// Handler for Custom Post Type -> Delete
	private async executeCustomPostTypeDelete(this: IExecuteFunctions, itemIndex: number): Promise<INodeExecutionData> {
		const postTypeSlug = this.getNodeParameter('postTypeSlug', itemIndex, '') as string;
		if (!postTypeSlug) {
			throw new NodeOperationError(this.getNode(), 'Post Type Slug is required.', { itemIndex });
		}
		const postId = this.getNodeParameter('postId', itemIndex, '') as string;
		if (!postId) {
			throw new NodeOperationError(this.getNode(), 'Post ID is required for Delete operation.', { itemIndex });
		}

		try {
			await this.wordpressApiRequest('DELETE', `/${postTypeSlug.trim()}/${postId}?force=true`);
			return { json: { message: `Custom Post Type item ${postId} (slug: ${postTypeSlug}) deleted permanently.` }, pairedItem: { itemIndex } };
		} catch (error) {
			if (this.continueOnFail()) {
				return { json: { error: error.message }, pairedItem: { itemIndex }, error };
			}
			throw error;
		}
	}

	// API request helper for binary file uploads
	private async wordpressApiRequestBinary(
		this: IExecuteFunctions,
		method: 'POST', // Typically POST for uploads
		endpoint: string,
		formData: Record<string, any>,
		credentials?: IWordpressApiCredentials,
	): Promise<any> {
		credentials = credentials ?? await this.getCredentials('wordpressApi') as IWordpressApiCredentials;
		const { url, username, password } = credentials;

		if (!url) {
			throw new NodeOperationError(this.getNode(), 'WordPress Site URL is not set in credentials!', { itemIndex: 0 });
		}

		const options: any = {
			method,
			baseURL: `${url.replace(/\/$/, '')}/wp-json/wp/v2`,
			url: endpoint,
			headers: {
				// Content-Type will be set by httpRequest helper for FormData
			},
			body: formData, // Pass FormData directly
			json: false, // Don't expect JSON response for all binary uploads initially, parse later if needed
			encoding: 'arraybuffer', // Expect binary response
			resolveWithFullResponse: true, // To get headers and status code
		};

		if (username && password) {
			options.headers['Authorization'] = `Basic ${Buffer.from(`${username}:${password}`).toString('base64')}`;
		}

		try {
			const response = await this.helpers.httpRequest(options);
			// WordPress often returns JSON even for media uploads, attempt to parse it
			try {
				return JSON.parse(Buffer.from(response.body).toString());
			} catch (parseError) {
				// If parsing fails, it might be a non-JSON response or an error
				if (response.statusCode >= 400) {
					throw new NodeOperationError(this.getNode(), `WordPress API Error: ${response.statusCode} - ${Buffer.from(response.body).toString()}`, { itemIndex: 0 });
				}
				return response.body; // Or handle as needed
			}
		} catch (error) {
			if (error.response && error.response.data && error.response.data.message) {
				throw new NodeOperationError(this.getNode(), `WordPress API Error: ${error.response.data.message}`, { itemIndex: 0, cause: error });
			}
			throw new NodeOperationError(this.getNode(), error, { itemIndex: 0 });
		}
	}

	// Handler for Post -> Create
	private async executePostCreate(this: IExecuteFunctions, itemIndex: number): Promise<INodeExecutionData> {
		const title = this.getNodeParameter('title', itemIndex, '') as string;
		const content = this.getNodeParameter('content', itemIndex, '') as string;
		const status = this.getNodeParameter('status', itemIndex, 'publish') as string;
		const excerpt = this.getNodeParameter('excerpt', itemIndex, '') as string;
		const categoriesRaw = this.getNodeParameter('categories', itemIndex, '') as string;
		const tagsRaw = this.getNodeParameter('tags', itemIndex, '') as string;

		const body: any = {
			title,
			content,
			status,
		};

		if (excerpt) {
			body.excerpt = excerpt;
		}

		// WordPress API expects category and tag IDs.
		// For simplicity, this initial implementation assumes IDs are provided.
		// A more advanced version could lookup IDs by name.
		if (categoriesRaw) {
			body.categories = categoriesRaw.split(',').map(cat => parseInt(cat.trim(), 10)).filter(catId => !isNaN(catId));
		}
		if (tagsRaw) {
			body.tags = tagsRaw.split(',').map(tag => parseInt(tag.trim(), 10)).filter(tagId => !isNaN(tagId));
		}

		try {
			const response = await this.wordpressApiRequest('POST', '/posts', body);
			return { json: response, pairedItem: { itemIndex } };
		} catch (error) {
			if (this.continueOnFail()) {
				return { json: { error: error.message }, pairedItem: { itemIndex }, error };
			}
			throw error; // Re-throw if not continuing on fail
		}
	}

	// Handler for Post -> Get
	private async executePostGet(this: IExecuteFunctions, itemIndex: number): Promise<INodeExecutionData> {
		const postId = this.getNodeParameter('postId', itemIndex, '') as string;
		if (!postId) {
			throw new NodeOperationError(this.getNode(), 'Post ID is required for Get operation.', { itemIndex });
		}

		try {
			const response = await this.wordpressApiRequest('GET', `/posts/${postId}`);
			return { json: response, pairedItem: { itemIndex } };
		} catch (error) {
			if (this.continueOnFail()) {
				return { json: { error: error.message }, pairedItem: { itemIndex }, error };
			}
			throw error;
		}
	}

	// Handler for Post -> Update
	private async executePostUpdate(this: IExecuteFunctions, itemIndex: number): Promise<INodeExecutionData> {
		const postId = this.getNodeParameter('postId', itemIndex, '') as string;
		if (!postId) {
			throw new NodeOperationError(this.getNode(), 'Post ID is required for Update operation.', { itemIndex });
		}

		const body: any = {};
		const title = this.getNodeParameter('title', itemIndex, null) as string | null;
		const content = this.getNodeParameter('content', itemIndex, null) as string | null;
		const status = this.getNodeParameter('status', itemIndex, null) as string | null;
		const excerpt = this.getNodeParameter('excerpt', itemIndex, null) as string | null;
		const categoriesRaw = this.getNodeParameter('categories', itemIndex, null) as string | null;
		const tagsRaw = this.getNodeParameter('tags', itemIndex, null) as string | null;

		if (title !== null) body.title = title;
		if (content !== null) body.content = content;
		if (status !== null) body.status = status;
		if (excerpt !== null) body.excerpt = excerpt;

		if (categoriesRaw !== null) {
			body.categories = categoriesRaw.split(',').map(cat => parseInt(cat.trim(), 10)).filter(catId => !isNaN(catId));
		}
		if (tagsRaw !== null) {
			body.tags = tagsRaw.split(',').map(tag => parseInt(tag.trim(), 10)).filter(tagId => !isNaN(tagId));
		}

		if (Object.keys(body).length === 0) {
			// Nothing to update, maybe return current item or a message
			const currentItem = this.getInputData(itemIndex)[0].json; // Or fetch fresh if necessary
			return { json: { message: "No fields provided to update.", post: currentItem }, pairedItem: { itemIndex } };
		}

		try {
			// WordPress API uses POST for updates as well, or PUT
			const response = await this.wordpressApiRequest('POST', `/posts/${postId}`, body);
			return { json: response, pairedItem: { itemIndex } };
		} catch (error) {
			if (this.continueOnFail()) {
				return { json: { error: error.message }, pairedItem: { itemIndex }, error };
			}
			throw error;
		}
	}

	// Handler for Post -> Delete
	private async executePostDelete(this: IExecuteFunctions, itemIndex: number): Promise<INodeExecutionData> {
		const postId = this.getNodeParameter('postId', itemIndex, '') as string;
		if (!postId) {
			throw new NodeOperationError(this.getNode(), 'Post ID is required for Delete operation.', { itemIndex });
		}

		try {
			// The delete endpoint might require `force=true` to bypass trash, depending on WP settings.
			// For now, we do a soft delete (to trash).
			await this.wordpressApiRequest('DELETE', `/posts/${postId}`);
			return { json: { message: `Post ${postId} deleted successfully (moved to trash).` }, pairedItem: { itemIndex } };
		} catch (error) {
			if (this.continueOnFail()) {
				return { json: { error: error.message }, pairedItem: { itemIndex }, error };
			}
			throw error;
		}
	}

	// Handler for Media -> Upload (Create)
	private async executeMediaUpload(this: IExecuteFunctions, itemIndex: number): Promise<INodeExecutionData> {
		const filePropertyName = this.getNodeParameter('file', itemIndex, '') as string;
		const title = this.getNodeParameter('title', itemIndex, '') as string; // Title is often derived from filename by WP if not set
		const altText = this.getNodeParameter('altText', itemIndex, '') as string;
		const caption = this.getNodeParameter('caption', itemIndex, '') as string;
		const description = this.getNodeParameter('description_media', itemIndex, '') as string; // Ensure this matches the property name

		if (!filePropertyName) {
			throw new NodeOperationError(this.getNode(), 'File property name is required for Media Upload.', { itemIndex });
		}

		const binaryData = await this.helpers.getBinaryDataBuffer(itemIndex, filePropertyName);
		const binaryDataDetails = this.helpers.assertBinaryData(itemIndex, filePropertyName);


		const formData: Record<string, any> = {
			file: {
				value: binaryData,
				options: {
					filename: binaryDataDetails.fileName, // Use the actual filename from binary data
					contentType: binaryDataDetails.mimeType, // Use the actual mimeType
				}
			}
		};

		// WordPress uses these fields in the form data for media creation
		if (title) formData.title = title;
		if (altText) formData.alt_text = altText; // WP uses 'alt_text'
		if (caption) formData.caption = caption;
		if (description) formData.description = description;


		try {
			// Using wordpressApiRequestBinary helper for multipart/form-data
			const response = await this.wordpressApiRequestBinary('POST', '/media', formData);
			return { json: response, pairedItem: { itemIndex } };
		} catch (error) {
			if (this.continueOnFail()) {
				return { json: { error: error.message }, pairedItem: { itemIndex }, error };
			}
			throw error;
		}
	}

	// Handler for Media -> Get
	private async executeMediaGet(this: IExecuteFunctions, itemIndex: number): Promise<INodeExecutionData> {
		const mediaId = this.getNodeParameter('mediaId', itemIndex, '') as string;
		if (!mediaId) {
			throw new NodeOperationError(this.getNode(), 'Media ID is required for Get operation.', { itemIndex });
		}
		try {
			const response = await this.wordpressApiRequest('GET', `/media/${mediaId}`);
			return { json: response, pairedItem: { itemIndex } };
		} catch (error) {
			if (this.continueOnFail()) {
				return { json: { error: error.message }, pairedItem: { itemIndex }, error };
			}
			throw error;
		}
	}

	// Handler for Media -> Update
	private async executeMediaUpdate(this: IExecuteFunctions, itemIndex: number): Promise<INodeExecutionData> {
		const mediaId = this.getNodeParameter('mediaId', itemIndex, '') as string;
		if (!mediaId) {
			throw new NodeOperationError(this.getNode(), 'Media ID is required for Update operation.', { itemIndex });
		}

		const body: any = {};
		const title = this.getNodeParameter('title', itemIndex, null) as string | null;
		const altText = this.getNodeParameter('altText', itemIndex, null) as string | null;
		const caption = this.getNodeParameter('caption', itemIndex, null) as string | null;
		const description = this.getNodeParameter('description_media', itemIndex, null) as string | null;

		if (title !== null) body.title = title;
		if (altText !== null) body.alt_text = altText; // WP uses 'alt_text'
		if (caption !== null) body.caption = caption;
		if (description !== null) body.description = description;

		if (Object.keys(body).length === 0) {
			const currentItem = this.getInputData(itemIndex)[0].json;
			return { json: { message: "No fields provided to update for media.", item: currentItem }, pairedItem: { itemIndex } };
		}

		try {
			// WordPress API uses POST for media updates
			const response = await this.wordpressApiRequest('POST', `/media/${mediaId}`, body);
			return { json: response, pairedItem: { itemIndex } };
		} catch (error) {
			if (this.continueOnFail()) {
				return { json: { error: error.message }, pairedItem: { itemIndex }, error };
			}
			throw error;
		}
	}

	// Handler for Media -> Delete
	private async executeMediaDelete(this: IExecuteFunctions, itemIndex: number): Promise<INodeExecutionData> {
		const mediaId = this.getNodeParameter('mediaId', itemIndex, '') as string;
		if (!mediaId) {
			throw new NodeOperationError(this.getNode(), 'Media ID is required for Delete operation.', { itemIndex });
		}

		try {
			// `force=true` for permanent deletion. Omit or set to false to move to trash.
			await this.wordpressApiRequest('DELETE', `/media/${mediaId}?force=true`);
			return { json: { message: `Media item ${mediaId} deleted permanently.` }, pairedItem: { itemIndex } };
		} catch (error) {
			if (this.continueOnFail()) {
				return { json: { error: error.message }, pairedItem: { itemIndex }, error };
			}
			throw error;
		}
	}


	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];
		let responseData;

		const resource = this.getNodeParameter('resource', 0, 'post') as string;
		const operation = this.getNodeParameter('operation', 0, 'getAll') as string;

		for (let i = 0; i < items.length; i++) {
			try {
				if (resource === 'post') {
					if (operation === 'create') {
						responseData = await this.executePostCreate(i);
					} else if (operation === 'get') {
						responseData = await this.executePostGet(i);
					} else if (operation === 'update') {
						responseData = await this.executePostUpdate(i);
					} else if (operation === 'delete') {
						responseData = await this.executePostDelete(i);
					} else {
						throw new NodeOperationError(this.getNode(), `Operation '${operation}' for resource 'Post' is not yet implemented.`, { itemIndex: i });
					}
				} else if (resource === 'media') {
					if (operation === 'upload') { // 'upload' is the create operation for media
						responseData = await this.executeMediaUpload(i);
					} else if (operation === 'get') {
						responseData = await this.executeMediaGet(i);
					} else if (operation === 'update') {
						responseData = await this.executeMediaUpdate(i);
					} else if (operation === 'delete') {
						responseData = await this.executeMediaDelete(i);
					} else {
						throw new NodeOperationError(this.getNode(), `Operation '${operation}' for resource 'Media' is not yet implemented.`, { itemIndex: i });
					}
				} else if (resource === 'customPostType') {
					if (operation === 'create') {
						responseData = await this.executeCustomPostTypeCreate(i);
					} else if (operation === 'get') {
						responseData = await this.executeCustomPostTypeGet(i);
					} else if (operation === 'update') {
						responseData = await this.executeCustomPostTypeUpdate(i);
					} else if (operation === 'delete') {
						responseData = await this.executeCustomPostTypeDelete(i);
					} else {
						throw new NodeOperationError(this.getNode(), `Operation '${operation}' for resource 'Custom Post Type' is not yet implemented.`, { itemIndex: i });
					}
				} else {
					throw new NodeOperationError(this.getNode(), `Resource '${resource}' is not recognized.`, { itemIndex: i });
				}
			} catch (error) {
				if (this.continueOnFail()) {
					returnData.push({ json: { error: error.message }, pairedItem: { itemIndex: i }, error });
					continue;
				}
				throw error;
			}
		}
		return [returnData];
	}
}
