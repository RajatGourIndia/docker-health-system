const express = require('express');
const { listImages } = require('../docker/images');

const router = express.Router();

router.get('/', async (req, res, next) => {
  try {
    const images = await listImages();
    res.json(images);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
