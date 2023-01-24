# KrakenFlex Back End Test

I have created a Node.js based Typescript script to solve the problem.

Install depencencies:

```
npm install
```

Compile Typescript:

```
npm run tsc
```

Run script:

```
node dist/main.js
```

Test project:

```
npm run test
```

## 500 status codes

500 status codes in the responses can be handled by retrying the request. In this project, I used `ts-retry` to retry the fetch requests when it is not successful.
