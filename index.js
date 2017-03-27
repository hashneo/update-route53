var AWS = require('aws-sdk');

// AWS Config
if ( process.env.AWS_ACCESS_KEY_ID ) {
    AWS.config.update({accessKeyId: process.env.AWS_ACCESS_KEY_ID, secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY});
}

/// / Set your region for future requests.
if ( process.env.AWS_REGION ) {
    AWS.config.update({region: process.env.AWS_REGION}); // e.g. eu-west-1
}

// get the Route53 library
var route53 = new AWS.Route53();

function getHostedZones() {
    return new Promise((fulfill, reject) => {
        route53.listHostedZones({}, function (err, data) {
            if (err)
                return reject(err);

            fulfill(data);
        });
    });
}

function getHostedZone(zone) {
    if ( !zone.endsWith('.') )
        zone = zone + '.';

    return new Promise((fulfill, reject) => {
        getHostedZones()
            .then((zones) => {
                zones.HostedZones.forEach((z) => {
                    if (z.Name === zone)
                        fulfill(z);
                });
                reject(new Error('zone not found'));
            })
            .catch((err) => {
                reject(err);
            });
    });
}

function getZoneRecords(zone){

    return new Promise( (fulfill, reject) =>{
        let params = {
            HostedZoneId: zone.Id
        };
        route53.listResourceRecordSets(params, function(err, data) {
            if (err)
                return reject(err);
            fulfill(data);
        });
    });
}

function createOrUpdateRecord( name, zone, value ){

    getHostedZone(zone)
        .then( (zone) => {
            return new Promise( ( fulfill, reject) =>{

                let params = {
                    'HostedZoneId': zone.Id, // our Id from the first call
                    'ChangeBatch': {
                        'Changes': [
                            {
                                'Action': 'UPSERT',
                                'ResourceRecordSet': {
                                    'Name': name + '.' + zone.Name,
                                    'Type': 'A',
                                    'TTL': 300,
                                    'ResourceRecords': [ { 'Value': value } ]
                                }
                            }
                        ]
                    }
                };

                route53.changeResourceRecordSets(params, function(err, data) {
                    if (err)
                        return reject(err);
                    fulfill(data);
                });
            })
        })
        .catch( (err) => {
            console.log(err);
        });
}

if ( process.argv.length < 5 ){
    console.log('invalid or missing parameters:');
    console.log( process.argv[0] + ' ' + process.argv[1] + ' <subdomain> <domain> <ip address(s)>' );
    process.exit(1);
}

createOrUpdateRecord( process.argv[2], process.argv[3], process.argv[4] );