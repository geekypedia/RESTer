/*global app, RegisterRoutes*/
app.factory('httpRequestInterceptor', function($rootScope, $q) {
	return {
		request: function(config) {
			$rootScope.loading = true;
			if ($rootScope.currentUser) {
				config.headers['api-key'] = $rootScope.currentUser.token;

				if ($rootScope.SETTINGS.enableSaaS) {
					if (config.method == "GET" || config.method == "DELETE" || config.method == "PUT") {
						var m = config.url.match(/\.[0-9a-z]+$/i);
						var bypassedKeywords = ['ui-grid'];
						var bypassedKeywordsMatches = bypassedKeywords.filter(function(p) {
							return config.url.indexOf(p) > -1
						});
						if ((m && m.length > 0) || bypassedKeywordsMatches.length > 0) {} else {
							var idx = config.url.lastIndexOf("/");
							var idt = config.url.substr(idx);
							if (config.method == "PUT" && isNaN(idt)) {
								config.data.secret = $rootScope.currentUser.secret;
							} else {
								var secret = '/?secret=';
								if (config.url.endsWith('/')) secret = '?secret=';
								if (config.url.indexOf('?') > -1) secret = '&secret=';
								config.url = config.url + secret + $rootScope.currentUser.secret;
							}
						}
					} else {
						config.headers['secret'] = $rootScope.currentUser.secret;
						config.data.secret = $rootScope.currentUser.secret;
					}
				}
			}
			return config;
		},
		response: function(response) {
			//if(response.headers()['content-type'] === "application/json; charset=utf-8"){
			$rootScope.loading = false;
			//}
			return response;
		},
		responseError: function(response) {
			$rootScope.loading = false;
			if (response.status === 401) {
				$rootScope.$emit('loginRequired');
			}
			if (response.status === 503) {
				$rootScope.$emit('outOfService');
			}
			return $q.reject(response);
		}
	};
});


function CustomRoutes() {
	this.routes = RegisterRoutes();
}

app.provider('customRoutes', function() {
	Object.assign(this, new CustomRoutes());

	this.$get = function() {
		return new CustomRoutes();
	};
});


app.config(async function(
                              $routeProvider, 
                              $resourceProvider, 
                              $httpProvider, 
                              $controllerProvider, 
                              $locationProvider,
                              customRoutesProvider, 
                             //adalAuthenticationServiceProvider, 
                         ) {
		var routes = customRoutesProvider.routes.customRoutes;
		var existingRoutes = routes.map(function(p) {
			return p.route;
		});
		AutoRoutes = [];

		var easyRoutes = customRoutesProvider.routes.easyRoutes || [];
		for (var i = 0; i < easyRoutes.length; i++) {
			var r = easyRoutes[i];
			routes.push({
				route: r,
				template: 'common/templates/list',
				controller: r
			});
			routes.push({
				route: r + '/new',
				template: 'common/templates/new',
				controller: r
			});
			routes.push({
				route: r + '/:id',
				template: 'common/templates/edit',
				controller: r
			});
			existingRoutes.push(r);
		}

		var autoRoutesExcluded = customRoutesProvider.routes.autoRoutesExcluded || [];
		autoRoutesExcluded.forEach(function(p) {
			existingRoutes.push(p);
		});

		var autoRoutes = customRoutesProvider.routes.autoRoutes;
		GLOBALS.menu = {
			masterItems: [],
			controllers: []
		};

		for (var i = 0; i < autoRoutes.length; i++) {
			var r = autoRoutes[i];
			routes.push({
				route: r,
				template: 'common/templates/list',
				controller: r
			});
			routes.push({
				route: r + '/new',
				template: 'common/templates/new',
				controller: r
			});
			routes.push({
				route: r + '/:id',
				template: 'common/templates/edit',
				controller: r
			});
			existingRoutes.push(r);
			GLOBALS.menu.masterItems.push({
				action: r,
				icon: 'settings',
				color: '',
				text: Helper.toTitleCase(Helper.replaceAll(r, '_', ' '))
			});
		}
    
        var aliases = customRoutesProvider.routes.aliases;
        
        for (var i in aliases) {
            var r= i;
            
            routes.push({
                route: r,
                template: 'common/templates/list',
                controller: r
            });
            routes.push({
                route: r + '/new',
                template: 'common/templates/new',
                controller: r
            });
            routes.push({
                route: r + '/:id',
                template: 'common/templates/edit',
                controller: r
            });
            existingRoutes.push(r);
    
        }    

		if (Settings.get().autoMasters) {
			var initInjector = angular.injector(['ng']);
			var $http = initInjector.get('$http');
			var S = Settings.get();
			await $http.get(S.baseUrl + '/metadata/table').then(function(r) {
				r.data.forEach(function(i) {
					for (j in i) {
						if (!(existingRoutes.indexOf(i[j]) > -1)) {
							autoRoutes.push(i[j]);
							GLOBALS.menu.masterItems.push({
								action: i[j],
								icon: 'settings',
								color: '',
								text: Helper.toTitleCase(Helper.replaceAll(i[j], '_', ' '))
							});


							routes.push({
								route: i[j],
								template: 'common/templates/list',
								controller: i[j]
							});
							routes.push({
								route: i[j] + '/new',
								template: 'common/templates/new',
								controller: i[j]
							});
							routes.push({
								route: i[j] + '/:id',
								template: 'common/templates/edit',
								controller: i[j]
							});

							GLOBALS.menu.controllers.push(i[j]);

							var auto = true;

							(function($controllerProvider, route, auto) {
								$controllerProvider.register(route + 'ControllerBase', ControllerFactory(route));

								$controllerProvider.register(route + 'Controller', function($scope, $controller, H) {
									//Copy all scope variables from Base Controller
									$controller(route + 'ControllerBase', {
										$scope: $scope
									});
									try {
										$controller(route + 'ControllerExtension', {
											$scope: $scope
										});
									} catch (ex) {
										console.log(ex);
									}


									if (auto) {
										$scope.initTextResourcesAuto();
									} else {
										$scope.initTextResourcesEasy();
									}

									//$scope.setListHeaders(headers);

								});
							})($controllerProvider, i[j], auto)

							//RegisterEasyController(i[j],null,null,true/*, data[easyRoutes[i]].headers*/);

						}
					}
				});
			}, function(e) {});
		}



		for (var i = 0; i < routes.length; i++) {
			var r = routes[i];
			$routeProvider.when('/' + r.route, {
				templateUrl: 'app/modules/' + r.template + '.html',
				controller: r.controller + 'Controller'
			});
		}

		$httpProvider.interceptors.push('httpRequestInterceptor');
    
		//Office 365
    
		var S = Settings.get();
		var office365 = S.office365;
        if(office365){
            $locationProvider.hashPrefix(S.hashPrefix);

            adalAuthenticationServiceProvider.init(
                office365,
                $httpProvider
            );
        }
    
    
	});

app.run(function($rootScope, $location, $cookies, H) {
	$rootScope.SETTINGS = H.SETTINGS;
	$rootScope.S = H.SETTINGS;
	$rootScope.M = H.MESSAGES;

	$rootScope.fieldTypes = H.SETTINGS.fieldTypes;

	$rootScope.openRoutes = H.getOpenRoutes();

	$rootScope.$on("$locationChangeStart", function(event, next, current) {
		if (!$rootScope.currentUser) {

			var cookie = $cookies.get(H.getCookieKey());
			if (!cookie) {
				var locationPath = $location.path();
				if(locationPath.endsWith('/')){
					locationPath = locationPath.substr(0, locationPath.length - 1);
				}
                if(locationPath == ''){
                    locationPath = '/';
                }

				if ($rootScope.openRoutes.indexOf(locationPath) > -1) {} else {
                    if(!H.S.openApp){
						$rootScope.lastLocation = locationPath;                    
						$location.path('/sign-in');	
                    }
				}
			} else {
				var cu = JSON.parse(cookie);
				$rootScope.currentUser = typeof cu === 'string' ? JSON.parse(cu) : cu;
                
				$rootScope.currentTheme = {
					bg : ( $rootScope.currentUser.profile ? $rootScope.currentUser.profile.theme_bg :  ( $rootScope.currentUser.organization ? $rootScope.currentUser.organization.theme_bg : (H.S.theme ? H.S.theme.background : 'light'))),
                    col : ( $rootScope.currentUser.profile ? $rootScope.currentUser.profile.theme_col :  ( $rootScope.currentUser.organization ? $rootScope.currentUser.organization.theme_col : (H.S.theme ? H.S.theme.color : 'black'))),
                    alt : ( $rootScope.currentUser.profile ? $rootScope.currentUser.profile.theme_alt :  ( $rootScope.currentUser.organization ? $rootScope.currentUser.organization.theme_alt : (H.S.theme ? H.S.theme.alternate : 'light'))),
                    cont : ( $rootScope.currentUser.profile ? $rootScope.currentUser.profile.theme_cont :  ( $rootScope.currentUser.organization ? $rootScope.currentUser.organization.theme_cont : (H.S.theme ? H.S.theme.contrast : 'grey')))
				}
                                            
				if (next && current) {
					$rootScope.$emit("buildMenu");
				}

			}
		}
	});

	$rootScope.$on("loginRequired", function(event, next, current) {
        if(!H.S.openApp){
            // GLOBALS.registry.sideNavStatus = false;
            // $('.all-nav').hide(); //CUSTOM
            // $('.menu-static').show();
            // $('.menu-loading').hide();
    		GLOBALS.methods.logout();
            
    		$cookies.remove(H.getCookieKey());
    		delete $rootScope.currentUser;
    		$location.path('/sign-in');
        }
	});

	$rootScope.$on("outOfService", function(event, next, current) {
		$cookies.remove(H.getCookieKey());
		delete $rootScope.currentUser;
		$location.path('/out-of-service');
	});

	$rootScope.$on("buildMenu", function(event, next, current) {
		GLOBALS.methods.sideNavDelayed(H.S.menu);
		// var timeout = 2500;
		// if (Settings.get().autoMasters) {
		// 	timeout = 2500;
		// 	// setTimeout(function(){
		// 	// 	for(k in GLOBALS.menu.controllers){
		// 	// 		var c = GLOBALS.menu.controllers[k];
		// 	// 		RegisterEasyController(c,null,null,true/*, data[easyRoutes[i]].headers*/);	
		// 	// 	}
		// 	// }, timeout);
		// }
	});

    $rootScope.$on("buildMenuOnce", function(event, next, current) {
		if(!$rootScope.menuBuiltOnce){
			$rootScope.menuBuiltOnce = true;
			GLOBALS.methods.sideNavDelayed(H.S.menu);
		}
		
		// var timeout = 2500;
		// if (Settings.get().autoMasters) {
		// 	timeout = 2500;
		// 	// setTimeout(function(){
		// 	// 	for(k in GLOBALS.menu.controllers){
		// 	// 		var c = GLOBALS.menu.controllers[k];
		// 	// 		RegisterEasyController(c,null,null,true/*, data[easyRoutes[i]].headers*/);	
		// 	// 	}
		// 	// }, timeout);
		// }
	});

    $rootScope.$on('changeLocation', function(event, next, current){
		event.preventDefault();
	    $rootScope.$evalAsync(function() {
	       $location.path(next);
	    });
	});


});
