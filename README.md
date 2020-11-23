# Daily access report

Run daily in AWS Lambda this code generates an email in SendGrid after pulling the current access report data from CloudCannon.

It retrieves the [Handlebars template from Sendgrid](https://mc.sendgrid.com/design-library/your-designs/3aaf2986-a36d-4a7d-883b-28cb497eb56f/preview) and executes a first pass render with the [report data](https://parksaustralia.gov.au/kakadu/access/feed.xml).

It posts the rendered HTML back to SendGrid as a [draft email](https://mc.sendgrid.com/single-sends). The [mailing lists](https://mc.sendgrid.com/contacts/lists/fc55886e-c778-41d8-a0d8-83cde65deaa2) and [unsubscribe groups](https://mc.sendgrid.com/unsubscribe-groups/15891/edit/preview/unsubscribe) are set automatically.

The code runs daily at 10:00 am Darwin time and creates a [scheduled single send in SendGrid](https://mc.sendgrid.com/single-sends) which is scheduled to automatically send at 10:30 am Darwin time.

This project is set up and deployed using [AWS CDK](https://docs.aws.amazon.com/cdk/).

## Development

This project requires [Node.js 12.x](https://nodejs.org/en/download/releases/) and that you have [AWS credentials](https://docs.aws.amazon.com/cli/latest/userguide/cli-configure-files.html) configured in order to deploy.

- `npm install`
- `npm run test`
- `npm run debug`

The project includes a Github Codespaces config that will create an environment with all of the require dependencies installed. All that is required after creating the codespace is to run `aws configure` and enter your AWS API keys and region.

You may also like to set your SendGrid API key for local development and debugging:

`export SENDGRID_API_KEY="SG.<snip>"`

## Deployment

First the [SendGrid API key](#sendgrid-api-key) must be set in the account using AWS secrets manager.

Then you can deploy the stack with:

```
npm run cdk deploy
```

## SendGrid API key

The SendGrid API key is stored in AWS Secrets Manager and is pulled when deploying the application.

To set the key:

```
aws secretsmanager create-secret --name accessReport/sendgridApiKey --description "SendGrid API key" --secret-string "<key>"
```

To change the key, the secret needs to first be updated and then the CDK stack redeployed:

```
aws secretsmanager update-secret --name accessReport/sendgridApiKey --description "SendGrid API key" --secret-string "<key>"
```
