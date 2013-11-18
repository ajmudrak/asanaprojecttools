service classes
- oauthservice, has all api interaction functions
- oauthserviceconfig, has config for a specific oauth-based api

service config
includes service classes
- file that contains a global keyed array for use with proxy endpoints

proxy config
includes service config
- based on first path in path_info, initializes service via named config from config class

proxy endpoint
includes proxy config
- accesses a proxy api call from the initialized service

proxy callback endpoint
includes proxy config
- access an authorize api call from the initialized service

