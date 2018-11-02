# update-route53

Simple node.js app to update route53

#To Run

##To update a root domain
node run my-domain.com http://whatismyip.akamai.com/
or
node run my-domain.com 5.5.5.5


##To update a sub domain
node run sub-domain my-domain.com 10.0.0.1

#Environment Variables

AWS_ACCESS_KEY_ID <- AWS Key
AWS_SECRET_ACCESS_KEY <- Access Key
AWS_REGION <- Optional Region