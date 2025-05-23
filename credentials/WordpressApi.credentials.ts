import {
	IAuthenticateGeneric,
	ICredentialTestRequest,
	ICredentialType,
	INodeProperties,
} from 'n8n-workflow';

export class WordpressApi implements ICredentialType {
	name = 'wordpressApi';
	displayName = 'WordPress API';
	documentationUrl = 'wordpress'; // TODO: Add a real documentation URL
	properties: INodeProperties[] = [
		{
			displayName: 'WordPress Site URL',
			name: 'url',
			type: 'string',
			default: '',
			placeholder: 'https://example.com',
			description: 'The URL of the WordPress site',
		},
		{
			displayName: 'Username',
			name: 'username',
			type: 'string',
			default: '',
		},
		{
			displayName: 'Password',
			name: 'password',
			type: 'string',
			typeOptions: {
				password: true,
			},
			default: '',
		},
	];

	authenticate: IAuthenticateGeneric = {
		type: 'generic',
		properties: {
			// TODO: Adjust based on WordPress authentication (e.g., Basic Auth, Application Passwords)
			// For Application Passwords, username is the WordPress username, and password is the application password.
			// Basic Auth might require a plugin on WordPress.
			auth: {
				username: '={{ $credentials.username }}',
				password: '={{ $credentials.password }}',
			},
		},
	};

	// The block below tells how this credential can be tested.
	// TODO: Replace with a more specific WordPress API endpoint for testing credentials,
	// e.g., fetching user profile or site information.
	test: ICredentialTestRequest = {
		request: {
			baseURL: '={{ $credentials.url }}',
			// Example: Check if the REST API is available.
			// Adjust the endpoint as needed for a reliable credential test.
			url: '/wp-json/',
		},
	};
}
