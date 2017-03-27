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
                reject(new Error('hosted zone not found'));
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

    return new Promise( (fulfill, reject) => {


        getHostedZone(zone)
            .then((zone) => {
                return new Promise((fulfill, reject) => {

                    let params = {
                        HostedZoneId: zone.Id, // our Id from the first call
                        ChangeBatch: {
                            Changes: [
                                {
                                    Action: 'UPSERT',
                                    ResourceRecordSet: {
                                        Name: (name ? (name + '.') : '') + zone.Name,
                                        Type: 'A',
                                        TTL: 300,
                                        ResourceRecords: [{Value: value}]
                                    }
                                }
                            ]
                        }
                    };

                    route53.changeResourceRecordSets(params, function (err, data) {
                        if (err)
                            return reject(err);
                        fulfill( data );
                    });
                })
            })
            .then( (data) => {
                fulfill(data)
            })
            .catch((err) => {
                reject(err);
            });
    });
}

if ( process.argv.length < 4 ){
    console.log('invalid or missing parameters:');
    console.log('node ' + process.argv[1] + ' [entry] <hosted zone> <ip address(s) | http://ip_service >' );
    process.exit(1);
}

let i = 2;
let subdomain = process.argv.length == 5 ? process.argv[i++] : null;
let zone = process.argv[i++];
let value = process.argv[i++];

let getValue = new Promise( (fulfill) => {
    fulfill(value);
});

if ( value.match( /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{2,256}\.[a-z]{2,6}\b([-a-zA-Z0-9@:%_\+.~#?&//=]*)/) ){

    getValue = new Promise( (fulfill, reject) => {
        const request = require('request');

        request(value, function (error, response, body) {
            if (error)
                return reject(error);

            if (response.statusCode != 200)
                reject(new Error(response.statusCode));

            fulfill(body.replace('\n','').replace('\r',''));
        });
    });
}

getValue
    .then( (value)=> {
        createOrUpdateRecord( subdomain, zone, value )
            .then( (data) =>{
                console.log(data);
            })
    })
    .catch( (err) => {
        console.error(err);
    });
