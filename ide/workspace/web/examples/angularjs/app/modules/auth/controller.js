/*global app*/
app.controller('authController', function($scope, $rootScope, $http, $location, $cookies, $injector, loginEventService, H, R, M, S, $window) {
	if($rootScope.currentUser){
		//$location.path('/');
	} else {
		//Office 365
		if (S.office365) {
            var adalAuthenticationService = $injector.get('adalAuthenticationService');
			if (adalAuthenticationService.userInfo && adalAuthenticationService.userInfo.isAuthenticated) {
				if (!$rootScope.potentialEmployee) {
					$scope.authMessage = 'Found existing user session on yourdomain.com. Validating ...';

					var email = adalAuthenticationService.userInfo.userName;
					$http.get(H.S.baseUrl + '/sso/validate?ssoid=' + email)
						.then(function(r) {
							$scope.authMessage = 'Found existing user session on yourdomain.com. Logging in ...';
							var data = r.data;
							if (data && data.user) {
								$rootScope.currentUser = data.user;
								$rootScope.$emit("buildMenuOnce");
								var locationPath = $rootScope.lastLocation;
								if (!locationPath || (locationPath && locationPath.startsWith('/sign-in'))) {
									locationPath = '/';
								}
								$location.path(locationPath);
								//$location.path('/');
							} else {
								if (data && data.employee) {
									$rootScope.potentialEmployee = data;
								} else {
									$rootScope.potentialEmployee = {
										user: {
											email: adalAuthenticationService.userInfo.userName
										},
										employee: {
											email: adalAuthenticationService.userInfo.userName,
											username: adalAuthenticationService.userInfo.userName.replace('@yourdomain.com', ''),
											fullname: adalAuthenticationService.userInfo.userName.replace('.', ' ').replace('@yourdomain.com', '')
										}
									};
								}
								setTimeout(function() {
									//$location.path('/employee-self-registration');	
									//$scope.$apply();
									//$window.location.assign('./#/employee-self-registration');
									//$window.location.replace('https://ops.healthtechindia.com/portal/#/employee-self-registration');
									$rootScope.$broadcast('changeLocation', '/employee-self-registration');
								}, 300);

							}
						}, function(e) {
							//$rootScope.potentialEmployee = data;
							//$location.path('/new-employee');
						});
				} else {
					if ($rootScope.potentialEmployee.employee) {

						$scope.data.username = $rootScope.potentialEmployee.employee.username;
						$scope.data.email = $rootScope.potentialEmployee.employee.email;
						$scope.data.employee_name = $rootScope.potentialEmployee.employee.fullname;
					}

					setTimeout(function() {
						$rootScope.$broadcast('changeLocation', '/employee-self-registration');
					}, 300);


				}

			}
		}

    }
	
	$scope.forms = {};
	
	$scope.H = H;
	$scope.M = M;
	$scope.S = S;
	
	$scope.data = {};
	
	$scope.data.roles = [{id: 'user', title: 'User'}, {id: 'admin', title: 'Administrator'}];
	
	//$scope.loading = false;

	$scope.login = function(){
		//$scope.loading = true;
		// $('.menu-static').hide();
		// $('.menu-loading').show();
		GLOBALS.methods.sideNavLoading();
		
		$http.post(H.SETTINGS.baseUrl + '/users/login', {email: $scope.email, password: $scope.password})
			.then(function(r){
				$scope.error = "";
				if(!r.data.token){
					$scope.error = M.E500;
					//$scope.loading = false;
					return;
				}
				$rootScope.currentUser = r.data;
            
				$rootScope.currentTheme = {
					bg : ( $rootScope.currentUser.profile ? $rootScope.currentUser.profile.theme_bg :  ( $rootScope.currentUser.organization ? $rootScope.currentUser.organization.theme_bg : (H.S.theme ? H.S.theme.background : 'light'))),
                    col : ( $rootScope.currentUser.profile ? $rootScope.currentUser.profile.theme_col :  ( $rootScope.currentUser.organization ? $rootScope.currentUser.organization.theme_col : (H.S.theme ? H.S.theme.color : 'black'))),
                    alt : ( $rootScope.currentUser.profile ? $rootScope.currentUser.profile.theme_alt :  ( $rootScope.currentUser.organization ? $rootScope.currentUser.organization.theme_alt : (H.S.theme ? H.S.theme.alternate : 'light'))),
                    cont : ( $rootScope.currentUser.profile ? $rootScope.currentUser.profile.theme_cont :  ( $rootScope.currentUser.organization ? $rootScope.currentUser.organization.theme_cont : (H.S.theme ? H.S.theme.contrast : 'grey')))
				}
            
				$cookies.putObject(H.getCookieKey(), JSON.stringify(r.data));
				GLOBALS.methods.sideNav(null, S.menu);
				$location.path('/');	

			}, function(e){
				if(e && e.data && e.data.error && e.data.error.status){
					if(e.data.error.code == 404 && e.data.error.message == "Not Found"){
						$scope.error = M.LOGIN_API_UNAVAILABLE;
					} else {
						$scope.error = e.data.error.message ? e.data.error.message : e.data.error.status;	
					}
					
				}

				GLOBALS.methods.logout();
				//$scope.loading = false;
			});
	};

	$scope.forgotPassword = function(){
		//$scope.loading = true;
		$http.post(H.SETTINGS.baseUrl + '/users/forgot-password', {email: $scope.email})
			.then(function(r){
				$scope.error = M.RECOVERY_EMAIL_SENT;
				//$scope.loading = false;
			}, function(e){
				if(e && e.data && e.data.error && e.data.error.status){
					if(e.data.error.code == 404 && e.data.error.message == "Not Found"){
						$scope.error = M.LOGIN_API_UNAVAILABLE;
					} else {
						$scope.error = e.data.error.message ? e.data.error.message : e.data.error.status;
					}
				}
				//$scope.loading = false;
			});
	};

	$scope.register = function(){
		var route = 'users';
		var data = {username: $scope.data.username, email: $scope.data.email, password: $scope.data.password};
		if(S.enableSaaS) {
			route = 'organizations'; 
			data = {organization: $scope.data.organization, email: $scope.data.email};
		}else{
			if($scope.data.password != $scope.data.confirmPassword){
				$scope.error = "Password and Confirm Password should match!";
				return;
			}
		}
		
		$http.post(H.SETTINGS.baseUrl + '/' + route +'/register', data)
			.then(function(r){
				$scope.error = M.REGISTRATION_EMAIL_SENT;
			}, function(e){
				if(e && e.data && e.data.error && e.data.error.status){
					if(e.data.error.code == 404 && e.data.error.message == "Not Found"){
						$scope.error = M.REGISTER_API_UNAVAILABLE;
					} else {
						$scope.error = e.data.error.message ? e.data.error.message : e.data.error.status;
					}
				}
			});
	};
	
	$scope.logout = function(){
		// GLOBALS.registry.sideNavStatus = false;
		// $('.all-nav').hide(); //CUSTOM
		// $('.menu-static').show();
		// $('.menu-loading').hide();
		GLOBALS.methods.logout();
		
		$cookies.remove(H.getCookieKey());
		delete $rootScope.currentUser;

        if (S.office365) {
			$scope.adLogout();
		}
        
		$location.path('/sign-in');
	};
    
	$scope.adLogin = function() {
		adalAuthenticationService.login();
	}

	$scope.adLogout = function() {
		adalAuthenticationService.logOut();
	}

	$scope.createProfile = function() {
		R.submit('sso/register', $scope.data, function(r) {
			$location.path('/');
		});
	}
    
	
	GLOBALS.methods.autoFocus();
});


