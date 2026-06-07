# Maria's Atelier Backend App

## Description

The app is built with `Nest.JS` framework 
It provides the following backend functionality for the frontend `Maria's Atelier` app (https://github.com/mlatysheva/marias-art-atelier):
- Public endpoints for listing available paintings and viewing painting details
- Protected CRUD functionality for creating, editing and deleting paintings
- Cookie-based authentication using `passport` library
- Password protection using `bcrypt` library
- Public integration with `Stripe` checkout so visitors can buy without creating an account
- Websocket connection based on `socket.io` library to update available paintings in real time after a successful Stripe purchase
- `Postgres` database to maintain users and paintings
- `Prisma ORM` to build and maintain Postgres database schemas 
- `class` transformer and validator to implement validation of database types

## Authentication and public access

The public storefront does not require authentication:

- `GET /paintings?status=available` returns paintings available for sale
- `GET /paintings/:paintingId` returns a painting detail page payload
- `POST /checkout/session` creates a Stripe checkout session

Management endpoints remain protected by cookie-based JWT authentication:

- `POST /paintings`
- `PATCH /paintings/:paintingId`
- `DELETE /paintings/:paintingId`
- `GET /paintings/admin`
- painting image upload/update endpoints

Unauthenticated websocket connections are disconnected cleanly. Authenticated clients receive painting update events.

## Project setup

```bash
$ npm install
```

## Compile and run the project

```bash
# development
$ npm run start

# watch mode
$ npm run start:dev

# connect stripe checkout endpoint
$ stripe listen --forward-to http://localhost:3001/checkout/webhook
or simply run the command
$ npm run stripe
```

## Running the app in more detail

After installing the dependencies with `npm install` and starting the app with `npm run start:dev`, your terminal should be showing successful logs:

![Logs in console](screenshots/console_logs.png)

Then open a new terminal and type the following command:
`stripe listen --forward-to http://localhost:3001/checkout/webhook`
or run the script `npm run stripe`


This will open a stripe webhook endpoint to listen for events coming from the Stripe checkout session:

![Stripe checkout webhook](screenshots/stripe_events_webhook.png)

Some endpoints tested with Postman:

Post request to `/users` to create a new user:

![Create a new user](screenshots/signup_new_user.png)

Post request to `/auth/login` to sign in a user:

![Login a user](screenshots/login_user.png)

Get request to `paintings` to get all available paintings. This endpoint is public:

![Get all paintings](screenshots/get_paintings.png)

Post request to `paintings` to add a new painting, with invalid entries. This endpoint requires authentication:

![Add a new painting with validation](screenshots/validation_new_painting.png)

Post request to Stripe events webhook:

![Stripe checkout webhook](screenshots/stripe_checkout_session.png)

Post request to `/checkout/session` creates a Stripe checkout session for an available painting and does not require authentication.

The `paintings` table in PG Admin:

![Paintings table in PG Admin](screenshots/pg_admin_paintings_table.png)

Post request to `ai/generate-description` to automatically generate a description with Open AI based on tags provided:

![Generate description with Open AI](screenshots/description_generation_with_openai.png)

## Stack used
- Node.js
- NestJS
- Stripe to provide payment functionality
- Open AI API to automatically generate description based on tags
- `bcrypt` library to encrypt passwords
- `passport` library to provide authentication
- `socket.io` library to provide websocket functionality
