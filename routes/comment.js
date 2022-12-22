const express = require("express");
const cookieParser = require("cookie-parser");

const app = express();
const router = express.Router();
app.use(cookieParser());

/* middleware */
const authMiddleware = require("../middlewares/authMiddleware.js");

/* models */
const { User, Post, Comment } = require("../models");

// 댓글 작성 API
router.post("/post/:postId/comment", authMiddleware, async (req, res) => {
  try {
    const { postId } = req.params;
    // 게시글 존재안할때
    const post = Post.findOne({ postId });
    if (!post) {
      return res
        .status(404)
        .json({ errorMessage: "게시글이 존재하지 않습니다." });
    }
    const { userId } = res.locals.user.dataValues;
    const { comment } = req.body;

    if (!comment) {
      return res
        .status(412)
        .json({ errorMessage: "내용 형식이 올바르지 않습니다." });
    }
    await Comment.create({ comment, postId, userId });
    res.status(200).json({ message: "댓글을 작성하였습니다." });
  } catch {
    res.status(400).json({ errorMessage: "댓글 작성에 실패하였습니다." });
  }
});

// 댓글 목록 조회 API
router.get("/post/:postId/comments", async (req, res) => {
  try {
    const { postId } = req.params;

    // 게시글 존재안할때
    const post = Post.findOne({ where: { postId } });
    if (!post) {
      return res
        .status(404)
        .json({ errorMessage: "게시글이 존재하지 않습니다." });
    }

    const comments = await Comment.findAll({
      order: [["createdAt", "DESC"]],
      where: { postId },
      include: [
        {
          model: User,
          attributes: ["nickname"],
          required: true,
        },
      ],
    });
    res.status(200).json({ comments });
  } catch (err) {
    console.log(err);
    res.status(400).json({ errorMessage: "댓글을 불러오는데 실패했습니다." });
  }
});

// 댓글 수정 API
router.put("/comment/:commentId", authMiddleware, async (req, res) => {
  try {
    const { commentId } = req.params;
    //댓글존재유무
    const data = await Comment.findOne({ where: { commentId } });
    if (!data) {
      return res
        .status(404)
        .json({ errorMessage: "댓글이 존재하지 않습니다." });
    }

    //댓글 쓴 당사자인지 확인
    const { userId } = res.locals.user.dataValues;
    if (userId !== data.userId) {
      return res.status(401).json({ errorMessage: "댓글 작성자가 아닙니다." });
    }

    // 댓글수정
    const { comment } = req.body;
    if (!comment) {
      return res
        .status(412)
        .json({ errorMessage: "내용 형식이 올바르지 않습니다." });
    }

    await Comment.update({ comment }, { where: { commentId } });
    res.status(200).json({ message: "댓글을 수정하였습니다." });
  } catch {
    res.status(400).json({ errorMessage: "댓글 수정에 실패하였습니다." });
  }
});

// 댓글 삭제 API
router.delete("/comment/:commentId", authMiddleware, async (req, res) => {
  try {
    const { commentId } = req.params;
    //댓글존재유무
    const comment = await Comment.findOne({ where: { commentId } });
    if (!comment) {
      return res
        .status(404)
        .json({ errorMessage: "댓글이 존재하지 않습니다." });
    }

    //댓글 쓴 당사자인지 확인
    const { userId } = res.locals.user.dataValues;
    if (userId !== comment.userId) {
      return res.status(401).json({ errorMessage: "댓글 작성자가 아닙니다." });
    }

    // 댓글삭제
    await comment.destroy();
    res.json({ Message: "댓글 삭제 완료" });
  } catch {
    res.status(400).json({ errorMessage: "댓글 삭제에 실패하였습니다." });
  }
});

module.exports = router;
