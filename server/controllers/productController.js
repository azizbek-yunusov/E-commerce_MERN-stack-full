const ProductModel = require("../models/ProductModel");
const cloudinary = require("../utils/cloudinary");

const getAllProducts = async (req, res) => {
  try {
    const products = await ProductModel.find()
      .populate("createdBy", "_id name")
      .populate("category", "_id name");

    res.status(201).json({
      products,
    });
  } catch (err) {
    console.log(err);
  }
};

const getbestProducts = async (req, res) => {
  try {
    const products = await ProductModel.find().populate(
      "createdBy",
      "_id name"
    );
    const bestProducts = products.filter((item) => {
      return item.ratings > 3.5;
    });
    res.status(201).json({
      bestProducts,
    });
  } catch (err) {
    console.log(err);
  }
};

const getProduct = async (req, res) => {
  try {
    const product = await ProductModel.findById(req.params.id)
      .populate("createdBy", "_id name")
      .populate("reviews.user", "_id name");
    res.status(201).json({ product });
  } catch (err) {
    console.log(err);
  }
};

const createProduct = async (req, res) => {
  try {
    let images = [...req.body.images];
    let imagesBuffer = [];

    for (let i = 0; i < images.length; i++) {
      const result = await cloudinary.v2.uploader.upload(images[i], {
        folder: "products",
      });

      imagesBuffer.push({
        public_id: result.public_id,
        url: result.secure_url,
      });
    }

    req.body.images = imagesBuffer;
    req.body.createdBy = req.user.id;

    const product = await ProductModel.create(req.body);
    await product.save();
    res.status(200).json({
      product,
    });
  } catch (err) {
    console.log(err);
  }
};

const updateProduct = async (req, res) => {
  try {
    const { name, price, descr, image, category, inStock } = req.body;
    const updateProduct = await ProductModel.findByIdAndUpdate(req.params.id, {
      name,
      price,
      image,
      descr,
      category,
      inStock,
    });
    res.status(200).json({ updateProduct });
  } catch (err) {
    console.log(err);
  }
};

const deleteProduct = async (req, res) => {
  const product = await ProductModel.findById(req.params.id);
  if (!product) {
    return res.status(401).json({ msg: "Product not found" });
  }
  for (let i = 0; i < product.images.length; i++) {
    await cloudinary.v2.uploader.destroy(product.images[i].public_id);
  }
  await product.remove();
  res.status(201).json({
    msg: "DELETED",
  });
};

const addReview = async (req, res) => {
  try {
    const { rating, comment, productId } = req.body;
    const review = {
      user: req.user.id,
      name: req.user.id,
      rating: Number(rating),
      comment,
    };

    const product = await ProductModel.findById(productId);

    const isReviewed = product.reviews.find(
      (rev) => rev.user.toString() === req.user.id.toString()
    );
    if (isReviewed) {
      product.reviews.forEach((rev) => {
        if (rev.user.toString() === req.user.id.toString())
          (rev.rating = rating), (rev.comment = comment);
      });
    } else {
      product.reviews.push(review);
      product.numOfReviews = product.reviews.length;
    }

    let avg = 0;

    product.reviews.forEach((rev) => {
      avg += rev.rating;
    });

    product.ratings = avg / product.reviews.length;

    await product.save({ validateBeforeSave: false });

    res.status(200).json({
      success: true,
      product,
    });
  } catch (err) {
    console.log(err);
  }
};
module.exports = {
  getAllProducts,
  getbestProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
  addReview,
};
