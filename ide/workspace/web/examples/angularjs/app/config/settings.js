/*global app*/
class Settings{
	static get(){
		return {
		"baseUrl": "../../../../../api",
		"productName": "pRESTige",
		"supportEmail": "support@prestigeframework.com",
		"enableSaaS": true,
		"openRegistration": true,
		"openApp": false,
		"legacyMode": false,
		"theme": {
			"background": "primary",
			"color": "white",
			"alternate": "dodgerblue",
			"contrast": "black"            
		},
		"menu": "expand", //expand or overlap,
		"autoMasters": false,
		"showMastersMenu": true,
		"defaultPermissions": {
				view: ['user', 'admin'],
				add: ['admin'],
				edit: ['admin'],
				remove: ['admin'],
				extract: ['admin']				
		},
		"overridePermissions":{
			"organizations": {
				view: ['superadmin'],
				add: ['superadmin'],
				edit: ['superadmin'],
				remove: ['superadmin'],
				extract: ['superadmin']
			},        
    		/*
			"routeName1": {
				view: ['user', 'admin'],
				add: ['admin'],
				edit: ['admin'],
				remove: ['admin'],
				extract: ['admin']
			},
			"routeName2": {
				view: ['user', 'admin'],
				add: ['admin'],
				edit: ['admin'],
				remove: ['admin'],
				extract: ['admin']
			}
	    	*/            
		},
		// "office365": {
  //          instance: 'https://login.microsoftonline.com/', 
  //          tenant: '',
  //          clientId: '',
  //          extraQueryParameter: 'nux=1',
  //          anonymousEndpoints: [ '/']
		// },
        hashPrefix: '!',    
		}
	}
}
app.service('S', function() {
	return Settings.get();
});
