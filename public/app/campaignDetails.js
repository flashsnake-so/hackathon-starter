app.controller('campaignDetailsCtrl', function ($scope, $uibModal, $rootScope, $routeParams, $http, CampaignService) {
    var id = $routeParams.id;

    $scope.myCampaigns = [];
    $scope.submittedForm = false;
    $scope.isCalendarOpened = false;
    CampaignService.getCampaigns({campaignIds: id, "count": 1}).then(function(campaigns){
        $scope.campaign = campaigns.data[0];
        $scope.$apply   ();
        $http.get('/userDetails/'+ campaigns.data[0].userId).then(function(res){
            if(res.data){
                $scope.ownerPic = res.data.profile.picture;
                $scope.ownerName = res.data.profile.name;
            }
        });
    }).catch(function(){
            console.log("error");
        });

    $scope.getMyCampaigns = function(){
        if($scope.user._id && $scope.user._id.length > 0){
            CampaignService.getCampaigns({userId: $scope.user._id}).then(function(campaigns){
                $scope.myCampaigns = campaigns.data;
                $scope.$apply   ();
            }).catch(function(){
                    console.log("error");
                });
        }
    };
    if($scope.user._id.length > 0){
        CampaignService.getCampaigns({userId: $scope.user._id}).then(function(campaigns){
            $scope.myCampaigns = campaigns.data;
            $scope.$apply   ();
        }).catch(function(){
                console.log("error");
            });

    $scope.appForm = {
        applicationId: generateUUID(),
        userId: $rootScope.user._id,
        postContent: "",
        requirements: "",
        applicantCampaignId: "",
        facebookPageId: "",
        reasons: "",
        campaignId: id,
        ownerUserId: "",
        actionTime:""
    }

    $scope.pageList = [];
    if($rootScope.fbToken){
        $scope.apiClient.pagesGet({"accessToken": $rootScope.fbToken}, {}, {
                headers:{"Content-type": "application/json"}
            }
        ).then(function(res){
                $scope.pageList = res.data.data;
                $scope.appForm.facebookPageId = $scope.pageList[0].id;
                $scope.$apply();
            }).catch(function(){
                console.log("Cannot get pages ");
            });
    }
    $scope.submitAppForm = function(){
        $scope.appForm.ownerUserId = $scope.campaign.userId;
        var actionTime = new Date();
        actionTime.setDate($scope.date.getDate());
        actionTime.setHours($scope.time.getHours());
        actionTime.setMinutes($scope.time.getMinutes());
        $scope.appForm.actionTime = actionTime.getTime()+"";
        if ($scope.appForm.postContent !=''){
            $scope.apiClient.campaignsApplicationPost({campaignId: id}, $scope.appForm, {
                    headers:{"Content-type": "application/json"}
                }
            ).then(function(res){
                 if(!res.data.errorMessage){
                     $rootScope.alerts.push({type:"success", msg:"Successfully applied to campaign."});
                     $scope.submittedForm = true;
                 } else {
                     $rootScope.alerts.push({type:"danger", msg:"Failed to apply to campaign."});
                 }
                    $scope.$apply();


                }).catch(function(res){
                    $rootScope.alerts.push({type:"danger", msg:"Failed to apply to campaign."});
                    $scope.$apply();
                });
        }
    }

});
