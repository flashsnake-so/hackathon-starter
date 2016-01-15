app.controller('campaignDetailsCtrl', function ($scope, $uibModal, $rootScope, $routeParams, $http) {
    var id = $routeParams.id;
    var showForm = $routeParams.showForm || false;

    $scope.myCampaigns = [];
    $scope.showAppForm = showForm;
    $scope.apiClient.campaignGet({"count": 1, campaignIds: id, ageRange: 0, numberOfFollowers: 0}, {}, {
            headers:{"Content-type": "application/json"}
        }
    ).then(function(campaigns){
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
//    $scope.user.campaignIds = ["ebada479-9945-46c4-89bb-02a0fa81729f", "ce0d570a-92db-4f76-b21a-326404c5fd76"]
    if($scope.user.campaignIds.length > 0){
        $scope.apiClient.campaignGet({"count": 100, campaignIds: $scope.user.campaignIds.join(), ageRange: 0, numberOfFollowers: 0}, {}, {
                headers:{"Content-type": "application/json"}
            }
        ).then(function(campaigns){
                $scope.myCampaigns = campaigns.data;
                $scope.$apply   ();
            }).catch(function(){
                console.log("error");
            });
    }
    $scope.appForm = {
        campaignId: id,
        tradeCampaign: "",
        reasons: ""

    }
    $scope.submitAppForm = function(){

    }

});

