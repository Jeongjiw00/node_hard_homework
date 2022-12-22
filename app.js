const express = require("express");
const cookieParser = require("cookie-parser");
const app = express();

app.use(express.json());
app.use(cookieParser());

/* swagger */
const swaggerUi = require("swagger-ui-express");
const swaggerJsdoc = require("swagger-jsdoc");
const option = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "nodejs-skill-homework",
      version: "1.0.0",
      description: "API Test with Express.js",
    },
  },
  apis: ["./routes/*.js"],
};

/* routes */
app.use("/api", require("./routes/user.js"));
app.use("/api", require("./routes/post.js"));
app.use("/api", require("./routes/comment.js"));

const spec = swaggerJsdoc(option);
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(spec));

app.listen(8080, () => {
  console.log("서버가 요청을 받을 준비가 됐어요");
});
