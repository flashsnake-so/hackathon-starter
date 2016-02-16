app.controller('appStatusCtrl', function ($scope, $rootScope, $http, CampaignService) {
    $scope.user = $rootScope.user;
    $scope.appliedCampaigns = [];
    $scope.myApplications = [];
    $scope.maxDate = new Date();
    $scope.maxDate.setDate($scope.maxDate.getDate()+60);          //limit schedule to within 60 days
    $scope.minDate = new Date();
    $scope.selectedApply = {};

//    My Campaigns Tab

    $scope.selectedCampaign = {applications:[]};
    $scope.getMyCampaigns = function(){
        CampaignService.getCampaigns({userId: $scope.user._id}).then(function(campaigns){
            $scope.inProcessCampaigns = [];
            $scope.completedCampaigns = [];
            angular.forEach(campaigns.data, function(campaign){
                if(campaign.status === "completed"){
                    $scope.completedCampaigns.push(campaign);
                }else {
                    $scope.inProcessCampaigns.push(campaign);
                }
            });
            $scope.$apply();
        }).catch(function(){
                console.log("error");
            });
    };


    $scope.getMyCampaigns();

    //Get fb page list for accepting applications
    $scope.pageList = [];
    $scope.appForm = {};
    if($rootScope.fbToken){
        $scope.apiClient.pagesGet({"accessToken": $rootScope.fbToken}, {}, {
                headers:{"Content-type": "application/json"}
            }
        ).then(function(res){
                $scope.pageList = res.data.data;
                $scope.appForm.pageId = $scope.pageList[0].id;
                $scope.$apply();
            }).catch(function(){
                console.log("appStatus Cannot get pages ");
            });
    }

    $scope.showCampaignStatus = function(id){
        $scope.selectedCampaign.id = id;
        $scope.apiClient.campaignsApplicationGet({userId: "", campaignId: id}, {}, {
            headers:{"Content-type": "application/json"}
        }).then(function(res){
//                angular.forEach(res.data, function(application){
//                    application.actionTime = new Date();
//                });
                $scope.selectedCampaign.applications = res.data;
                var users = {};
                angular.forEach($scope.selectedCampaign.applications, function(apply){
                    if(apply.userId){
                        $http.get('/userDetails/'+ apply.userId).then(function(res){
                            if(res.data){
                                if(users[res.data._id]){
                                    apply.applicantProfile = users[res.data._id];
                                } else {
                                    apply.applicantProfile = res.data.profile;
                                    users[res.data._id] = res.data.profile;
                                }
                            }
                        });
                    }
                    if(!apply.ownerPostContent && !apply.ownerPageId){
                        angular.extend(apply, {ownerPostContent: "", ownerPageId:""});
                    }
                });
            $scope.$apply();
        });
    };

    $scope.acceptApply = function(application){
        application.status = 'accepted';
        var actionTime = new Date();
        actionTime.setDate(application.date.getDate());
        actionTime.setHours(application.time.getHours());
        actionTime.setMinutes(application.time.getMinutes());
        var newApply = {
            applicationId: application.applicationId,
            status: 'accepted',
            ownerActionTime:actionTime.getTime()+""
        };
        angular.extend(newApply, application);

        delete newApply.applicantProfile;
        delete newApply.date;
        delete newApply.isCalendarOpened;
        delete newApply.time;
        delete newApply.updateTime;
        delete newApply.createTime;

        $scope.apiClient.applicationPatch({applicationId: application.applicationId}, newApply).then(function(res){
            $rootScope.alerts.push({type:"success", msg:"Successfully accepted application"});
            $scope.$apply();
            $scope.selectedCampaign.applications = [];
            $scope.getMyCampaigns();
        });
    };


//    My Applications Tab
    $scope.showMyApplications = function(){
        $scope.apiClient.applicationGet({applicationId: "", userId: $scope.user._id}, {}).then(function(res){
            $scope.myApplications = res.data;
            $scope.$apply();
            var cIds = [];
            if($scope.myApplications.length > 0){
                for (var i=0; i<$scope.myApplications.length; i++){
                    if(cIds.indexOf($scope.myApplications[i].campaignId) === -1){
                        cIds.push($scope.myApplications[i].campaignId);
                    }
                }
                CampaignService.getCampaigns({campaignIds: cIds.join()}).then(function(campaigns){
                    $scope.appliedCampaigns = campaigns.data;
                    angular.forEach($scope.appliedCampaigns, function(campaign){
                        for(var i=0; i<$scope.myApplications.length; i++){
                            if(campaign.campaignId == $scope.myApplications[i].campaignId){
                                campaign.application =  $scope.myApplications[i];
                                break;
                            }
                        }
                    });
                    $scope.$apply();
                }).catch(function(){
                        console.log("error");
                    });
            }
        });
    };

    $scope.showApplicationStatus = function(campaign){
        $scope.selectedApply = campaign.application;
    }

    $scope.applicantSchedulePosts = function(application){
        $http.get('/extendFbToken/' + $rootScope.fbToken, {}).then(function(res){
            if(!res.data.message){
                $rootScope.fbToken = res.data.newToken;
                application.applicantAccessToken = $rootScope.fbToken;
                //schedule posts
                $http.post("/api/scheduleFacebookPosts", {"application": application}, {headers:{"Content-type": "application/json"}}).then(function(res){
                    $rootScope.alerts.push({type:"success", msg:"Post has been successfully scheduled"});
                    application.status = "scheduled";
                    var updatedApplication = {};
                    angular.copy(application, updatedApplication);
                    delete updatedApplication.updateTime;
                    delete updatedApplication.applicantAccessToken;
                    delete updatedApplication.createTime;
                    delete updatedApplication.$$hashKey;
                    delete updatedApplication.applicantProfile;
                    //Update application status
                    $scope.apiClient.applicationPatch({applicationId: updatedApplication.applicationId}, updatedApplication).then(function(res){
                        $scope.$apply();
                    });
                });
            }
        })
    }
//    $scope.applicantConfirmPostTime = function(application){
//        //TODO: set application status to confirmed
//        application.status = "confirmed";
//        var actionTime = new Date();
//        actionTime.setDate(application.date.getDate());
//        actionTime.setHours(application.time.getHours());
//        actionTime.setMinutes(application.time.getMinutes());
//        application.ownerActionTime = actionTime.getTime()+"";
//
//        delete application.date;
//        delete application.isCalendarOpened;
//        delete application.time;
//        delete application.updateTime;
//        delete application.createTime;
//        $scope.apiClient.applicationPatch({applicationId: application.applicationId}, application).then(function(res){
//            $rootScope.alerts.push({type:"success", msg:"Successfully accepted application"});
//            $scope.$apply();
//            $scope.selectedCampaign.applications = [];
//            $scope.getMyCampaigns();
//        });
//;
////        $http.get('/extendFbToken/' + $rootScope.fbToken, {}).then(function(res){
////            if(!res.data.message){
////                $rootScope.fbToken = res.data.newToken;
//////                $http.post("/account/profile", $scope.user, {headers:{"Content-type": "application/json"}
//////                });
////                $scope.apiClient.schedulepostPost({}, {
////                    applicationId: campaign.application.applicationId,
////                    pageId: campaign.application.pageId,
////                    actionTime: campaign.application.actionTime,
////                    accessToken: $rootScope.fbToken,
////                    message: campaign.application.message
////                }, {header: {"Content-type": "application/json"}}).then(function(res){
////                        $rootScope.alerts.push({type:"success", msg:"Post has been successfully scheduled"});
////                        campaign.application.status = "completed";
////                        delete campaign.application.updateTime;
////                        $scope.apiClient.applicationPatch({applicationId: campaign.application.applicationId}, campaign.application).then(function(res){
////                            $scope.$apply();
////                        });
////                        $scope.$apply();
////                    });
////            }
////        })
////        $scope.apiClient.schedulepostPost({"accessToken": $rootScope.fbToken}, {}, {
////                headers:{"Content-type": "application/json"}
////            }
////        ).then(function(res){
////                var pageList = res.data.data;
////                for (var i=0; i<pageList.length; i++){
////                    if(pageList[i].id == campaign.application.pageId ){
////                        fbPageAccessToken = pageList[i].access_token;
////                        break;
////                    }
////                }
////                if(fbPageAccessToken != ''){
////                }
////            }).catch(function(){
////                console.log("Cannot get pages ");
////            });
//
//    };
});
    $scope.applicantSchedulePosts = function(application){
        $http.get('/extendFbToken/' + $rootScope.fbToken, {}).then(function(res){
            if(!res.data.message){
                $rootScope.fbToken = res.data.newToken;
                application.applicantAccessToken = $rootScope.fbToken;
                //schedule posts
                $http.post("/api/scheduleFacebookPosts", {"application": application}, {headers:{"Content-type": "application/json"}}).then(function(res){
                    $rootScope.alerts.push({type:"success", msg:"Post has been successfully scheduled"});
                    application.status = "scheduled";
                    var updatedApplication = {};
                    angular.copy(application, updatedApplication);
                    delete updatedApplication.updateTime;
                    delete updatedApplication.applicantAccessToken;
                    delete updatedApplication.createTime;
                    delete updatedApplication.$$hashKey;
                    delete updatedApplication.applicantProfile;
                    //Update application status
                    $scope.apiClient.applicationApplicationIdPatch({applicationId: updatedApplication.applicationId}, updatedApplication).then(function(res){
                        $scope.$apply();
                    });
                });
            }
        })
    }
//    $scope.applicantConfirmPostTime = function(application){
//        //TODO: set application status to confirmed
//        application.status = "confirmed";
//        var actionTime = new Date();
//        actionTime.setDate(application.date.getDate());
//        actionTime.setHours(application.time.getHours());
//        actionTime.setMinutes(application.time.getMinutes());
//        application.ownerActionTime = actionTime.getTime()+"";
//
//        delete application.date;
//        delete application.isCalendarOpened;
//        delete application.time;
//        delete application.updateTime;
//        delete application.createTime;
//        $scope.apiClient.applicationPatch({applicationId: application.applicationId}, application).then(function(res){
//            $rootScope.alerts.push({type:"success", msg:"Successfully accepted application"});
//            $scope.$apply();
//            $scope.selectedCampaign.applications = [];
//            $scope.getMyCampaigns();
//        });
//;
////        $http.get('/extendFbToken/' + $rootScope.fbToken, {}).then(function(res){
////            if(!res.data.message){
////                $rootScope.fbToken = res.data.newToken;
//////                $http.post("/account/profile", $scope.user, {headers:{"Content-type": "application/json"}
//////                });
////                $scope.apiClient.schedulepostPost({}, {
////                    applicationId: campaign.application.applicationId,
////                    pageId: campaign.application.pageId,
////                    actionTime: campaign.application.actionTime,
////                    accessToken: $rootScope.fbToken,
////                    message: campaign.application.message
////                }, {header: {"Content-type": "application/json"}}).then(function(res){
////                        $rootScope.alerts.push({type:"success", msg:"Post has been successfully scheduled"});
////                        campaign.application.status = "completed";
////                        delete campaign.application.updateTime;
////                        $scope.apiClient.applicationPatch({applicationId: campaign.application.applicationId}, campaign.application).then(function(res){
////                            $scope.$apply();
////                        });
////                        $scope.$apply();
////                    });
////            }
////        })
////        $scope.apiClient.pagesGet({"accessToken": $rootScope.fbToken}, {}, {
////                headers:{"Content-type": "application/json"}
////            }
////        ).then(function(res){
////                var pageList = res.data.data;
////                for (var i=0; i<pageList.length; i++){
////                    if(pageList[i].id == campaign.application.pageId ){
////                        fbPageAccessToken = pageList[i].access_token;
////                        break;
////                    }
////                }
////                if(fbPageAccessToken != ''){
////                }
////            }).catch(function(){
////                console.log("Cannot get pages ");
////            });
//
//    };
});
