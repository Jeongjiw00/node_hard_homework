const express = require("express");
const cookieParser = require("cookie-parser");

const app = express();
const router = express.Router();
app.use(cookieParser());

/* middleware */
const authMiddleware = require("../middlewares/authMiddleware.js");

/* models */
const { User, Post, Comment, Like } = require("../models");

// 게시글 작성
router.post("/posts", authMiddleware, async (req, res) => {
  try {
    // console.log(res.locals.user.dataValues);
    const { userId } = res.locals.user.dataValues;
    const { title, content } = req.body;
    if (!title || !content) {
      return res
        .status(412)
        .json({ errorMessage: "제목이나 내용 형식이 올바르지 않습니다." });
    }

    await Post.create({ title, content, userId });
    res.status(200).json({ message: "게시글 작성에 성공하였습니다." });
  } catch (err) {
    console.log(err);
    res.status(400).json({ errorMessage: "게시글 작성에 실패하였습니다." });
  }
});

// 전체 게시글 조회========================================================================
router.get("/posts", async (req, res, next) => {
  try {
    const posts = await Post.findAll({
      include: [
        {
          model: User,
          attributes: ["nickname"],
          required: true,
        },
      ],
    });
    // console.log(posts);
    if (posts.length === 0) {
      return res
        .status(404)
        .json({ errorMessage: "게시글이 존재하지 않습니다." });
    }
    res.status(200).json({ posts });
  } catch (err) {
    console.log(err);
    res.status(400).json({ errorMessage: "게시글 조회에 실패하였습니다." });
  }
});

// 상세 게시글 조회========================================================================
router.get("/post/:postId", async (req, res, next) => {
  try {
    const { postId } = req.params;
    const post = await Post.findOne({
      where: { postId },
      include: [
        {
          model: User,
          attributes: ["nickname"],
          require: true,
        },
        {
          model: Comment,
          attributes: ["comment", "createdAt"],
          include: [
            {
              model: User,
              attributes: ["nickname"],
            },
          ],
        },
      ],
    });
    // console.log(post);
    res.json({ post });
  } catch (err) {
    console.log(err);
    res.status(400).json({ errorMessage: "게시글 조회에 실패하였습니다." });
  }
});
// 게시글 수정======================================================================
router.put("/post/:postId", authMiddleware, async (req, res) => {
  try {
    const { postId } = req.params;
    console.log(postId);
    // 게시글 불러오기
    const post = await Post.findOne({ where: { postId } });
    // 게시글이 존재하지 않을때
    if (!post) {
      return res
        .status(404)
        .json({ errorMessage: "게시글이 존재하지 않습니다." });
    }
    // 게시글 작성자가 아닐때
    const { userId } = res.locals.user.dataValues;
    if (userId !== post.userId) {
      return res
        .status(412)
        .json({ errorMessage: "게시글 작성자가 아닙니다." });
    }
    //수정하기
    const { title, content } = req.body;

    await Post.update({ title, content }, { where: { postId } });
    res.status(200).json({ message: "게시글을 수정에 성공했습니다!" });
  } catch {
    res.status(400).json({ errorMessage: "게시글 수정에 실패했습니다." });
  }
});

// 게시글 삭제======================================================================
router.delete("/post/:postId", authMiddleware, async (req, res) => {
  try {
    const { postId } = req.params;
    // 게시글 불러오기
    const post = await Post.findOne({ postId });
    // 게시글이 존재하지 않을때
    if (!post) {
      return res
        .status(404)
        .json({ errorMessage: "게시글이 존재하지 않습니다." });
    }
    // 게시글 작성자가 아닐때
    const { userId } = res.locals.user.dataValues;
    if (userId !== post.userId) {
      return res
        .status(412)
        .json({ errorMessage: "게시글 작성자가 아닙니다." });
    }
    //삭제하기
    await post.destroy();
    res.status(200).json({ message: "게시글을 삭제에 성공했습니다!" });
  } catch {
    res.status(400).json({ errorMessage: "게시글 삭제에 실패하였습니다." });
  }
});

// 게시글 좋아요 API
router.put("/post/:postId/like", authMiddleware, async (req, res) => {
  try {
    const { postId } = req.params;

    // 게시글 정보 불러오기
    const post = await Post.findOne({
      where: { postId },
    });
    // 해당 번호의 게시글이 존재하지 않음;
    if (!post) {
      return res
        .status(404)
        .json({ errorMessage: "게시글이 존재하지 않습니다." });
    }

    const { userId } = res.locals.user.dataValues; // 현재 로그인 되어있는 유저의 번호

    // 로그인 한 유저가 해당 게시글을 좋아요 한 적이 있는지?
    const isLike = await Like.findOne({
      where: [{ userId }, { postId }],
    });
    if (!isLike) {
      // 좋아요 한 적 없다면? 좋아요 해주자.
      // 1. post table 해당 게시글 좋아요 수 update + 1
      // 2. like table 유저번호, 게시글 번호 insert
      await Post.increment({ likes: 1 }, { where: { postId } });
      await Like.create({ userId, postId });
      res
        .status(200)
        .json({ success: true, message: "게시글의 좋아요를 등록하였습니다." });
    } else {
      // 좋아요 한 적 있다면? 좋아요 취소해주자
      // 1. post table 해당 게시글 좋아요 수 update - 1
      // 2. like table 유저번호, 게시글 번호 delete
      await Post.decrement({ likes: 1 }, { where: { postId } });
      await Like.destroy({
        where: [{ userId }, { postId }],
      });
      res
        .status(200)
        .json({ success: true, message: "게시글의 좋아요를 취소하였습니다." });
    }
  } catch (err) {
    console.log(err);
    res
      .status(400)
      .json({ errorMessage: "게시글의 좋아요를 불러오는 것을 실패했습니다." });
  }
});

// 내가 좋아요 누른 게시글 목록 API
router.get("/posts/like", authMiddleware, async (req, res) => {
  try {
    const { userId } = res.locals.user.dataValues; // 현재 로그인 되어있는 유저의 번호

    /*
          Likes table 에서 유저번호를 조건으로 
          게시글 번호를 매칭시켜 Posts table을 inner join,
          
          게시글 작성자 닉네임 뽑아오기 위해, Posts table의 userId 외래키를 매칭시켜,
          Users table과 inner join,
          
          뽑아올때, Posts table의 likes(좋아요수)를 order by DESC
      */
    const likePosts = await Like.findAll({
      where: { userId },
      attributes: [],
      include: [
        {
          model: Post,
          required: true,
          include: [
            {
              model: User,
              required: true,
              attributes: ["nickname"],
            },
          ],
        },
      ],
      order: [[{ model: Post }, "likes", "DESC"]],
      // [ 'likes', 'DESC' ] -> order by likes, desc
      // [ ['likes', 'DESC'] ] -> order by likes DESC
    });

    res.status(200).json({ likePosts });
  } catch {
    res
      .status(400)
      .json({ errorMessage: "게시글의 좋아요를 불러오는 것을 실패했습니다." });
  }
});

module.exports = router;
