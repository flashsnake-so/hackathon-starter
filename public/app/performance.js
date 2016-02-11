app.controller('performanceCtrl', function ($scope, $http, $rootScope, CampaignService) {
    $scope.selectedCampaign = {};
    $scope.completedCampaigns = [];
    $scope.loading = true;
    $scope.getMyCampaigns = function(){
        CampaignService.getCampaigns({campaignIds: $scope.user.campaignIds.join(), status: "completed"}).then(function(campaigns){
            $scope.completedCampaigns = campaigns.data;
            $scope.loading = false;
            $scope.$apply();
        }).catch(function(){
                console.log("error");
                $scope.loading = false;
                $scope.$apply();
            });
    };
    if($scope.user.campaignIds && $scope.user.campaignIds.length > 0){
        $scope.getMyCampaigns();
    }
    $scope.getPostStats = function(campaign){
        $scope.selectedCampaign = campaign;
        $scope.apiClient.campaignCampaignIdApplicationGet({campaignId: campaign.campaignId}, {}, {
            headers:{"Content-type": "application/json"}
        }).then(function(res){
                $scope.selectedCampaign.completedApplications = res.data;
                angular.forEach(res.data, function(apply){
                    $http.get('/userFacebookInsight/' + apply.userId + "/" + apply.facebookPostId).then(function(res){
                        if(!res.data.errorMessage){
                            var fbStats = JSON.parse(res.data.body);
                            apply.fbStats = fbStats;
                            angular.forEach(fbStats.age, function(value, key){
                                apply.fbStats.totalFollowerNum += value;
                            });
                            angular.forEach(fbStats.location, function(value,key){
                                apply.fbStats.totalLocationNum += value;
                            });
                            apply.loadedFbData = true;
                        } else {
                            $rootScope.alerts.push({type:"danger", msg:"Failed to load all post performance"});
                        }
                    })
                });
                $scope.$apply();
            });
    }
});
