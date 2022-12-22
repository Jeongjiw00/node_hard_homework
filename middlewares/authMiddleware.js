//jwt와 모델의 user가져오기
const jwt = require("jsonwebtoken");
const { User } = require("../models");

module.exports = async (req, res, next) => {
  try {
    const token = req.cookies.accessToken;
    if (!token) {
      return res.status(401).send({ errorMessage: "로그인이 필요합니다." });
    }

    const { userId } = jwt.verify(token, "sparta-secret-key");

    const user = await User.findByPk(userId);

    res.locals.user = user;
    next();
  } catch {
    res.status(401).send({ errorMessage: "로그인이 필요합니다." });
  }
};
