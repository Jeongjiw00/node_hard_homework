const express = require("express");
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");

const { User } = require("../models");
// const authMiddleware = require("../middleware/auth-middleware");

const app = express();
const router = express.Router();

app.use(cookieParser());

//회원가입========================================================================
router.post("/users", async (req, res) => {
  try {
    // 이미 로그인되어 토큰이 발급된상태
    if (req.cookies.accessToken) {
      return res.json({ message: "이미 로그인이 되어있습니다." });
    }

    const { nickname, password, confirmPassword } = req.body;

    // nickname 형식(숫자,대소문자 조합의 3자리 이상)
    const nicknameCheck = /^[A-Za-z0-9]{3,}$/;
    if (!nicknameCheck.test(nickname)) {
      return res
        .status(412)
        .json({ errorMessage: "nickname 형식이 올바르지 않습니다." });
    }

    // password 형식(숫자,대소문자,특수문자 조합의 4자리 이상)
    const pwCheck = /^[A-Za-z0-9]{4,}$/;
    if (!pwCheck.test(password)) {
      return res
        .status(412)
        .json({ errorMessage: "password 형식이 올바르지 않습니다." });
    }

    // password 형식(nickname이 포함된 password인지 아닌지 판별)
    if (password.match(nickname)) {
      return res
        .status(412)
        .json({ errorMessage: "password에 nickname이 포함되어 있습니다." });
    }

    // password double check
    if (password !== confirmPassword) {
      return res.status(400).json({
        errorMessage: "패스워드가 패스워드 확인란과 다릅니다.",
      });
    }

    // nickname이 동일한게 이미 있는지 확인하기 위해 가져온다.
    const existsUsers = await User.findOne({ where: { nickname } });
    console.log(existsUsers);
    if (existsUsers) {
      return res.status(400).send({
        errorMesssage: "중복된 닉네임입니다.",
      });
    }

    const user = new User({ nickname, password });
    await user.save();

    res.status(201).json({ message: "회원가입이 완료되었습니다." });
  } catch {
    res.status(400).json({ errorMessage: "데이터 형식이 올바르지 않습니다." });
  }
});

// 로그인=========================================================================
router.post("/auth", async (req, res) => {
  try {
    // 이미 로그인되어 토큰이 발급된상태
    if (req.cookies.accessToken) {
      return res.json({ message: "이미 로그인이 되어있습니다." });
    }

    const { nickname, password } = req.body;

    const user = await User.findOne({ where: { nickname } });

    if (!user || password !== user.password) {
      return res
        .status(400)
        .json({ errorMessage: "닉네임 또는 패스워드를 확인해주세요" });
    }

    // 유저 고유번호, 1day
    const accessToken = jwt.sign(
      {
        userId: user.userId,
      },
      "sparta-secret-key",
      { expiresIn: "1d" }
    );

    // Access Token in Cookie
    res.cookie("accessToken", accessToken);
    return res
      .status(200)
      .json({ message: "로그인에 성공했습니다!", token: accessToken });
  } catch (err) {
    res.status(400).json({ errorMessage: "로그인에 실패하였습니다." });
  }
});

module.exports = router;
