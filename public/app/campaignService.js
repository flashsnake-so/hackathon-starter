app.service('CampaignService', function () {
    var defaultSearch = {
        "ageRange": "",
        "count": "100",
        "numberOfFollowers": 0,
        "campaignIds": "",
        "startKey": "",
        "tags": "",
        "status": ""
    };
    this.apiClient = apigClientFactory.newClient({
        "apiKey": 'G84MftERYj7VP0ACf3uQh3w9ewFbgdi06C1GtA1B'
    });


    this.getCampaigns = function(filters){
        return this.apiClient.campaignGet(angular.extend(defaultSearch, filters), {}, {
                headers:{"Content-type": "application/json"}
            }
        );
    }

});