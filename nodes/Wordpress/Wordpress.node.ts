import type {
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
	ICredentialData,
	IExecuteFunctions, // Added IExecuteFunctions
} from 'n8n-workflow';
import { NodeConnectionType, NodeOperationError } from 'n8n-workflow';

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
						resource: ['post', 'customPostType'], // Apply to post and CPT
						operation: ['create', 'update'],
					},
				},
				description: 'The title of the item.',
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
						resource: ['post', 'customPostType'], // Apply to post and CPT
						operation: ['create', 'update'],
					},
				},
				description: 'The content of the item.',
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
						resource: ['post', 'customPostType'], // Apply to post and CPT
						operation: ['create', 'update'],
					},
				},
				description: 'The status of the item.',
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
						resource: ['post', 'customPostType'], // Apply to post and CPT
						operation: ['create', 'update'],
					},
				},
				description: 'The excerpt of the item.',
			},
			// Categories (for Create, Update - Post only)
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
			// Tags (for Create, Update - Post only)
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
					fileBinary: true,
				},
				description: 'The file to upload. Select a binary property that contains the file data.',
			},
			// Title (for Media Upload, Update) - Note: 'title' field is already defined above, ensure displayOptions are merged or specific if needed
			// For Media, title is not mandatory on create/upload but available for update.
			// The generic 'title' field above will show for Media create/update. If specific behavior is needed, a new field with a different name or more specific displayOptions would be required.

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
			// Description (for Media Upload, Update)
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

			// Fields for Custom Post Type resource operations
			// Post ID (for Get, Update, Delete - Custom Post Type)
			// This reuses the 'postId' field defined for 'Post' resource.
			// Title, Content, Status, Excerpt for CPT are also covered by the generic fields due to displayOptions.

			// Custom Fields (for Create, Update - Custom Post Type)
			{
				displayName: 'Custom Fields',
				name: 'customFields',
				type: 'fixedCollection',
				default: [],
				placeholder: 'Add Custom Field',
				displayOptions: {
					show: {
						resource: ['customPostType'],
						operation: ['create', 'update'],
					},
				},
				typeOptions: {
					multipleValues: true,
					properties: [ // Moved 'properties' under 'typeOptions'
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
				},
				description: 'Custom fields (metadata) for the custom post type item.',
			},
		],
	};

	// Centralized API request helper
	private static async wordpressApiRequest(
		execFuncs: IExecuteFunctions,
		method: 'GET' | 'POST' | 'PUT' | 'DELETE',
		endpoint: string,
		body: object = {},
		credentials?: IWordpressApiCredentials,
	): Promise<any> {
		credentials = credentials ?? await execFuncs.getCredentials('wordpressApi') as IWordpressApiCredentials;
		const { url, username, password } = credentials;

		if (!url) {
			throw new NodeOperationError(execFuncs.getNode(), 'WordPress Site URL is not set in credentials!');
		}

		const options: any = {
			method,
			baseURL: `${url.replace(/\/$/, '')}/wp-json/wp/v2`,
			url: endpoint,
			headers: {
				'Accept': 'application/json',
				'Content-Type': 'application/json',
			},
			json: true,
		};

		if (body && Object.keys(body).length > 0) {
			options.body = body;
		}

		if (username && password) {
			options.auth = { user: username, pass: password };
			options.headers['Authorization'] = `Basic ${Buffer.from(`${username}:${password}`).toString('base64')}`;
		}

		try {
			return await execFuncs.helpers.httpRequest(options);
		} catch (error) {
			if (error.response && error.response.data && error.response.data.message) {
				throw new NodeOperationError(execFuncs.getNode(), `WordPress API Error: ${error.response.data.message}`);
			}
			throw new NodeOperationError(execFuncs.getNode(), error);
		}
	}

	// API request helper for binary file uploads
	private static async wordpressApiRequestBinary(
		execFuncs: IExecuteFunctions,
		method: 'POST',
		endpoint: string,
		formData: Record<string, any>,
		credentials?: IWordpressApiCredentials,
	): Promise<any> {
		credentials = credentials ?? await execFuncs.getCredentials('wordpressApi') as IWordpressApiCredentials;
		const { url, username, password } = credentials;

		if (!url) {
			throw new NodeOperationError(execFuncs.getNode(), 'WordPress Site URL is not set in credentials!');
		}

		const options: any = {
			method,
			baseURL: `${url.replace(/\/$/, '')}/wp-json/wp/v2`,
			url: endpoint,
			headers: {},
			body: formData,
			json: false,
			encoding: 'arraybuffer',
			resolveWithFullResponse: true,
		};

		if (username && password) {
			options.headers['Authorization'] = `Basic ${Buffer.from(`${username}:${password}`).toString('base64')}`;
		}

		try {
			const response = await execFuncs.helpers.httpRequest(options);
			try {
				return JSON.parse(Buffer.from(response.body).toString());
			} catch (parseError) {
				if (response.statusCode >= 400) {
					throw new NodeOperationError(execFuncs.getNode(), `WordPress API Error: ${response.statusCode} - ${Buffer.from(response.body).toString()}`);
				}
				return response.body;
			}
		} catch (error) {
			if (error.response && error.response.data && error.response.data.message) {
				throw new NodeOperationError(execFuncs.getNode(), `WordPress API Error: ${error.response.data.message}`);
			}
			throw new NodeOperationError(execFuncs.getNode(), error);
		}
	}

	// Handler for Custom Post Type -> Create
	private static async executeCustomPostTypeCreate(execFuncs: IExecuteFunctions, itemIndex: number): Promise<INodeExecutionData> {
		const postTypeSlug = execFuncs.getNodeParameter('postTypeSlug', itemIndex, '') as string;
		if (!postTypeSlug) {
			throw new NodeOperationError(execFuncs.getNode(), 'Post Type Slug is required for Custom Post Type operations.', { itemIndex }); // Keep itemIndex here
		}

		const title = execFuncs.getNodeParameter('title', itemIndex, '') as string;
		const content = execFuncs.getNodeParameter('content', itemIndex, '') as string;
		const status = execFuncs.getNodeParameter('status', itemIndex, 'publish') as string;
		const excerpt = execFuncs.getNodeParameter('excerpt', itemIndex, '') as string;
		const customFieldsData = execFuncs.getNodeParameter('customFields', itemIndex, []) as Array<{ key?: string; value?: string }>;


		const body: any = { title, content, status };
		if (excerpt) body.excerpt = excerpt;

		if (customFieldsData && customFieldsData.length > 0) {
			body.meta = {};
			for (const field of customFieldsData) {
				if (field.key) {
					body.meta[field.key] = field.value ?? '';
				}
			}
		}

		try {
			const response = await Wordpress.wordpressApiRequest(execFuncs, 'POST', `/${postTypeSlug.trim()}`, body);
			return { json: response, pairedItem: itemIndex };
		} catch (error) {
			if (execFuncs.continueOnFail()) {
				return { json: { error: error.message }, pairedItem: itemIndex, error };
			}
			throw error;
		}
	}

	// Handler for Custom Post Type -> Get
	private static async executeCustomPostTypeGet(execFuncs: IExecuteFunctions, itemIndex: number): Promise<INodeExecutionData> {
		const postTypeSlug = execFuncs.getNodeParameter('postTypeSlug', itemIndex, '') as string;
		if (!postTypeSlug) {
			throw new NodeOperationError(execFuncs.getNode(), 'Post Type Slug is required.', { itemIndex }); // Keep itemIndex here
		}
		const postId = execFuncs.getNodeParameter('postId', itemIndex, '') as string;
		if (!postId) {
			throw new NodeOperationError(execFuncs.getNode(), 'Post ID is required for Get operation.', { itemIndex }); // Keep itemIndex here
		}

		try {
			const response = await Wordpress.wordpressApiRequest(execFuncs, 'GET', `/${postTypeSlug.trim()}/${postId}`);
			return { json: response, pairedItem: itemIndex };
		} catch (error) {
			if (execFuncs.continueOnFail()) {
				return { json: { error: error.message }, pairedItem: itemIndex, error };
			}
			throw error;
		}
	}

	// Handler for Custom Post Type -> Update
	private static async executeCustomPostTypeUpdate(execFuncs: IExecuteFunctions, itemIndex: number): Promise<INodeExecutionData> {
		const postTypeSlug = execFuncs.getNodeParameter('postTypeSlug', itemIndex, '') as string;
		if (!postTypeSlug) {
			throw new NodeOperationError(execFuncs.getNode(), 'Post Type Slug is required.', { itemIndex }); // Keep itemIndex here
		}
		const postId = execFuncs.getNodeParameter('postId', itemIndex, '') as string;
		if (!postId) {
			throw new NodeOperationError(execFuncs.getNode(), 'Post ID is required for Update operation.', { itemIndex }); // Keep itemIndex here
		}

		const body: any = {};
		const title = execFuncs.getNodeParameter('title', itemIndex, null) as string | null;
		const content = execFuncs.getNodeParameter('content', itemIndex, null) as string | null;
		const status = execFuncs.getNodeParameter('status', itemIndex, null) as string | null;
		const excerpt = execFuncs.getNodeParameter('excerpt', itemIndex, null) as string | null;
		const customFieldsData = execFuncs.getNodeParameter('customFields', itemIndex, null) as Array<{ key?: string; value?: string }> | null;

		if (title !== null) body.title = title;
		if (content !== null) body.content = content;
		if (status !== null) body.status = status;
		if (excerpt !== null) body.excerpt = excerpt;

		if (customFieldsData && customFieldsData.length > 0) {
			body.meta = {};
			for (const field of customFieldsData) {
				if (field.key) {
					body.meta[field.key] = field.value ?? '';
				}
			}
		}

		if (Object.keys(body).length === 0) {
			const currentItem = execFuncs.getInputData(itemIndex)[0].json;
			return { json: { message: "No fields provided to update for custom post type.", item: currentItem }, pairedItem: itemIndex };
		}

		try {
			const response = await Wordpress.wordpressApiRequest(execFuncs, 'POST', `/${postTypeSlug.trim()}/${postId}`, body);
			return { json: response, pairedItem: itemIndex };
		} catch (error) {
			if (execFuncs.continueOnFail()) {
				return { json: { error: error.message }, pairedItem: itemIndex, error };
			}
			throw error;
		}
	}

	// Handler for Custom Post Type -> Delete
	private static async executeCustomPostTypeDelete(execFuncs: IExecuteFunctions, itemIndex: number): Promise<INodeExecutionData> {
		const postTypeSlug = execFuncs.getNodeParameter('postTypeSlug', itemIndex, '') as string;
		if (!postTypeSlug) {
			throw new NodeOperationError(execFuncs.getNode(), 'Post Type Slug is required.', { itemIndex }); // Keep itemIndex here
		}
		const postId = execFuncs.getNodeParameter('postId', itemIndex, '') as string;
		if (!postId) {
			throw new NodeOperationError(execFuncs.getNode(), 'Post ID is required for Delete operation.', { itemIndex }); // Keep itemIndex here
		}

		try {
			await Wordpress.wordpressApiRequest(execFuncs, 'DELETE', `/${postTypeSlug.trim()}/${postId}?force=true`);
			return { json: { message: `Custom Post Type item ${postId} (slug: ${postTypeSlug}) deleted permanently.` }, pairedItem: itemIndex };
		} catch (error) {
			if (execFuncs.continueOnFail()) {
				return { json: { error: error.message }, pairedItem: itemIndex, error };
			}
			throw error;
		}
	}

	// Handler for Post -> Create
	private static async executePostCreate(execFuncs: IExecuteFunctions, itemIndex: number): Promise<INodeExecutionData> {
		const title = execFuncs.getNodeParameter('title', itemIndex, '') as string;
		const content = execFuncs.getNodeParameter('content', itemIndex, '') as string;
		const status = execFuncs.getNodeParameter('status', itemIndex, 'publish') as string;
		const excerpt = execFuncs.getNodeParameter('excerpt', itemIndex, '') as string;
		const categoriesRaw = execFuncs.getNodeParameter('categories', itemIndex, '') as string;
		const tagsRaw = execFuncs.getNodeParameter('tags', itemIndex, '') as string;

		const body: any = { title, content, status };
		if (excerpt) body.excerpt = excerpt;

		if (categoriesRaw) {
			body.categories = categoriesRaw.split(',').map(cat => parseInt(cat.trim(), 10)).filter(catId => !isNaN(catId));
		}
		if (tagsRaw) {
			body.tags = tagsRaw.split(',').map(tag => parseInt(tag.trim(), 10)).filter(tagId => !isNaN(tagId));
		}

		try {
			const response = await Wordpress.wordpressApiRequest(execFuncs, 'POST', '/posts', body);
			return { json: response, pairedItem: itemIndex };
		} catch (error) {
			if (execFuncs.continueOnFail()) {
				return { json: { error: error.message }, pairedItem: itemIndex, error };
			}
			throw error;
		}
	}

	// Handler for Post -> Get
	private static async executePostGet(execFuncs: IExecuteFunctions, itemIndex: number): Promise<INodeExecutionData> {
		const postId = execFuncs.getNodeParameter('postId', itemIndex, '') as string;
		if (!postId) {
			throw new NodeOperationError(execFuncs.getNode(), 'Post ID is required for Get operation.', { itemIndex }); // Keep itemIndex here
		}

		try {
			const response = await Wordpress.wordpressApiRequest(execFuncs, 'GET', `/posts/${postId}`);
			return { json: response, pairedItem: itemIndex };
		} catch (error) {
			if (execFuncs.continueOnFail()) {
				return { json: { error: error.message }, pairedItem: itemIndex, error };
			}
			throw error;
		}
	}

	// Handler for Post -> Update
	private static async executePostUpdate(execFuncs: IExecuteFunctions, itemIndex: number): Promise<INodeExecutionData> {
		const postId = execFuncs.getNodeParameter('postId', itemIndex, '') as string;
		if (!postId) {
			throw new NodeOperationError(execFuncs.getNode(), 'Post ID is required for Update operation.', { itemIndex }); // Keep itemIndex here
		}

		const body: any = {};
		const title = execFuncs.getNodeParameter('title', itemIndex, null) as string | null;
		const content = execFuncs.getNodeParameter('content', itemIndex, null) as string | null;
		const status = execFuncs.getNodeParameter('status', itemIndex, null) as string | null;
		const excerpt = execFuncs.getNodeParameter('excerpt', itemIndex, null) as string | null;
		const categoriesRaw = execFuncs.getNodeParameter('categories', itemIndex, null) as string | null;
		const tagsRaw = execFuncs.getNodeParameter('tags', itemIndex, null) as string | null;

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
			const currentItem = execFuncs.getInputData(itemIndex)[0].json;
			return { json: { message: "No fields provided to update.", post: currentItem }, pairedItem: itemIndex };
		}

		try {
			const response = await Wordpress.wordpressApiRequest(execFuncs, 'POST', `/posts/${postId}`, body);
			return { json: response, pairedItem: itemIndex };
		} catch (error) {
			if (execFuncs.continueOnFail()) {
				return { json: { error: error.message }, pairedItem: itemIndex, error };
			}
			throw error;
		}
	}

	// Handler for Post -> Delete
	private static async executePostDelete(execFuncs: IExecuteFunctions, itemIndex: number): Promise<INodeExecutionData> {
		const postId = execFuncs.getNodeParameter('postId', itemIndex, '') as string;
		if (!postId) {
			throw new NodeOperationError(execFuncs.getNode(), 'Post ID is required for Delete operation.', { itemIndex }); // Keep itemIndex here
		}

		try {
			await Wordpress.wordpressApiRequest(execFuncs, 'DELETE', `/posts/${postId}`);
			return { json: { message: `Post ${postId} deleted successfully (moved to trash).` }, pairedItem: itemIndex };
		} catch (error) {
			if (execFuncs.continueOnFail()) {
				return { json: { error: error.message }, pairedItem: itemIndex, error };
			}
			throw error;
		}
	}

	// Handler for Media -> Upload (Create)
	private static async executeMediaUpload(execFuncs: IExecuteFunctions, itemIndex: number): Promise<INodeExecutionData> {
		const filePropertyName = execFuncs.getNodeParameter('file', itemIndex, '') as string;
		const title = execFuncs.getNodeParameter('title', itemIndex, '') as string;
		const altText = execFuncs.getNodeParameter('altText', itemIndex, '') as string;
		const caption = execFuncs.getNodeParameter('caption', itemIndex, '') as string;
		const description = execFuncs.getNodeParameter('description_media', itemIndex, '') as string;

		if (!filePropertyName) {
			throw new NodeOperationError(execFuncs.getNode(), 'File property name is required for Media Upload.', { itemIndex }); // Keep itemIndex here
		}

		const binaryData = await execFuncs.helpers.getBinaryDataBuffer(itemIndex, filePropertyName);
		const binaryDataDetails = execFuncs.helpers.assertBinaryData(itemIndex, filePropertyName);

		const formData: Record<string, any> = {
			file: {
				value: binaryData,
				options: { filename: binaryDataDetails.fileName, contentType: binaryDataDetails.mimeType }
			}
		};

		if (title) formData.title = title;
		if (altText) formData.alt_text = altText;
		if (caption) formData.caption = caption;
		if (description) formData.description = description;

		try {
			const response = await Wordpress.wordpressApiRequestBinary(execFuncs, 'POST', '/media', formData);
			return { json: response, pairedItem: itemIndex };
		} catch (error) {
			if (execFuncs.continueOnFail()) {
				return { json: { error: error.message }, pairedItem: itemIndex, error };
			}
			throw error;
		}
	}

	// Handler for Media -> Get
	private static async executeMediaGet(execFuncs: IExecuteFunctions, itemIndex: number): Promise<INodeExecutionData> {
		const mediaId = execFuncs.getNodeParameter('mediaId', itemIndex, '') as string;
		if (!mediaId) {
			throw new NodeOperationError(execFuncs.getNode(), 'Media ID is required for Get operation.', { itemIndex }); // Keep itemIndex here
		}
		try {
			const response = await Wordpress.wordpressApiRequest(execFuncs, 'GET', `/media/${mediaId}`);
			return { json: response, pairedItem: itemIndex };
		} catch (error) {
			if (execFuncs.continueOnFail()) {
				return { json: { error: error.message }, pairedItem: itemIndex, error };
			}
			throw error;
		}
	}

	// Handler for Media -> Update
	private static async executeMediaUpdate(execFuncs: IExecuteFunctions, itemIndex: number): Promise<INodeExecutionData> {
		const mediaId = execFuncs.getNodeParameter('mediaId', itemIndex, '') as string;
		if (!mediaId) {
			throw new NodeOperationError(execFuncs.getNode(), 'Media ID is required for Update operation.', { itemIndex }); // Keep itemIndex here
		}

		const body: any = {};
		const title = execFuncs.getNodeParameter('title', itemIndex, null) as string | null;
		const altText = execFuncs.getNodeParameter('altText', itemIndex, null) as string | null;
		const caption = execFuncs.getNodeParameter('caption', itemIndex, null) as string | null;
		const description = execFuncs.getNodeParameter('description_media', itemIndex, null) as string | null;

		if (title !== null) body.title = title;
		if (altText !== null) body.alt_text = altText;
		if (caption !== null) body.caption = caption;
		if (description !== null) body.description = description;

		if (Object.keys(body).length === 0) {
			const currentItem = execFuncs.getInputData(itemIndex)[0].json;
			return { json: { message: "No fields provided to update for media.", item: currentItem }, pairedItem: itemIndex };
		}

		try {
			const response = await Wordpress.wordpressApiRequest(execFuncs, 'POST', `/media/${mediaId}`, body);
			return { json: response, pairedItem: itemIndex };
		} catch (error) {
			if (execFuncs.continueOnFail()) {
				return { json: { error: error.message }, pairedItem: itemIndex, error };
			}
			throw error;
		}
	}

	// Handler for Media -> Delete
	private static async executeMediaDelete(execFuncs: IExecuteFunctions, itemIndex: number): Promise<INodeExecutionData> {
		const mediaId = execFuncs.getNodeParameter('mediaId', itemIndex, '') as string;
		if (!mediaId) {
			throw new NodeOperationError(execFuncs.getNode(), 'Media ID is required for Delete operation.', { itemIndex }); // Keep itemIndex here
		}

		try {
			await Wordpress.wordpressApiRequest(execFuncs, 'DELETE', `/media/${mediaId}?force=true`);
			return { json: { message: `Media item ${mediaId} deleted permanently.` }, pairedItem: itemIndex };
		} catch (error) {
			if (execFuncs.continueOnFail()) {
				return { json: { error: error.message }, pairedItem: itemIndex, error };
			}
			throw error;
		}
	}


	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];
		let responseData: INodeExecutionData;

		const resource = this.getNodeParameter('resource', 0, 'post') as string;
		const operation = this.getNodeParameter('operation', 0, 'getAll') as string;

		for (let i = 0; i < items.length; i++) {
			try {
				if (resource === 'post') {
					if (operation === 'create') {
						responseData = await Wordpress.executePostCreate(this, i);
					} else if (operation === 'get') {
						responseData = await Wordpress.executePostGet(this, i);
					} else if (operation === 'update') {
						responseData = await Wordpress.executePostUpdate(this, i);
					} else if (operation === 'delete') {
						responseData = await Wordpress.executePostDelete(this, i);
					} else {
						throw new NodeOperationError(this.getNode(), `Operation '${operation}' for resource 'Post' is not yet implemented.`, { itemIndex: i });
					}
				} else if (resource === 'media') {
					if (operation === 'upload') {
						responseData = await Wordpress.executeMediaUpload(this, i);
					} else if (operation === 'get') {
						responseData = await Wordpress.executeMediaGet(this, i);
					} else if (operation === 'update') {
						responseData = await Wordpress.executeMediaUpdate(this, i);
					} else if (operation === 'delete') {
						responseData = await Wordpress.executeMediaDelete(this, i);
					} else {
						throw new NodeOperationError(this.getNode(), `Operation '${operation}' for resource 'Media' is not yet implemented.`, { itemIndex: i });
					}
				} else if (resource === 'customPostType') {
					if (operation === 'create') {
						responseData = await Wordpress.executeCustomPostTypeCreate(this, i);
					} else if (operation === 'get') {
						responseData = await Wordpress.executeCustomPostTypeGet(this, i);
					} else if (operation === 'update') {
						responseData = await Wordpress.executeCustomPostTypeUpdate(this, i);
					} else if (operation === 'delete') {
						responseData = await Wordpress.executeCustomPostTypeDelete(this, i);
					} else {
						throw new NodeOperationError(this.getNode(), `Operation '${operation}' for resource 'Custom Post Type' is not yet implemented.`, { itemIndex: i });
					}
				} else {
					throw new NodeOperationError(this.getNode(), `Resource '${resource}' is not recognized.`, { itemIndex: i });
				}
				returnData.push(responseData);
			} catch (error) {
				if (this.continueOnFail()) {
					returnData.push({ json: { error: error.message }, error, pairedItem: i });
					continue;
				}
				throw error;
			}
		}
		return [returnData];
	}
}
