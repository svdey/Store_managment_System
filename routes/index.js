// #region ALL require file
var express = require("express");
var router = express.Router();
const product = require("./Model/product");
const category = require("./Model/category");
const user = require("./Model/user");
var bcrypt = require("bcryptjs");
var jwt = require("jsonwebtoken");
var multer = require("multer");
const upload = multer({ dest: "tmp/csv/" });
var csv = require("csvtojson");
// #endregion
/* GET home page. */
const isValid = (req, res, next) => {
  var cookie = req.cookies.token;
  if (cookie) {
    next();
  } else {
    res.redirect("/login");
  }
};
router.get("/", function (req, res, next) {
  res.render("index", { title: "STEP TO SOFT" });
});
router.get("/employee", isValid, function (req, res, next) {
  res.render("employee", { title: "employee" });
});
// #region product section
router.get("/product", isValid, async function (req, res, next) {
  var searchFilter = {};
  if (req.query.categoryId) {
    searchFilter.categoryId = req.query.categoryId;
  }
  var productList = await product.find(searchFilter).populate("categoryId");
  var categoryList = await category.find({});
  for (var i = 0; i < productList.length; i++) {
    var actualPrice =
      Number(productList[i].price) -
      (Number(productList[i].price) * Number(productList[i].discount)) / 100;
    productList[i].actualPrice = actualPrice;
  }
  res.render("product", {
    title: "product",
    product: productList,
    categoryList: categoryList,
  });
});
router.post("/product-update", async function (req, res, next) {
  var updateData = req.body;
  if (updateData) {
    updateData = JSON.parse(JSON.stringify(updateData));
    var data = {
      name: updateData.name,
      qty: updateData.qty ? Number(updateData.qty) : 0,
      price: updateData.price ? Number(updateData.price) : 0,
      discount: updateData.discount ? Number(updateData.discount) : 0,
    };
    const updateProduct = await product.update(
      { _id: updateData.id },
      { $set: data }
    );
    if (updateProduct) {
      res.send({ success: "Product Updated successfully" });
    } else {
      res.send({ error: "Something went wrong" });
    }
  }
});
router.post("/product-delete", async function (req, res, next) {
  var id = req.body.id;
  if (id) {
    const deleteResponse = await product.remove({ _id: id });
    res.send({ success: "Product deleted successfully" });
  } else {
    res.send({ error: "Id is required" });
  }
});
router.post("/product-data", async function (req, res, next) {
  var productData = req.body;
  if (productData) {
    productData = JSON.parse(JSON.stringify(productData));
    var data = {
      name: productData.name,
      qty: productData.qty ? Number(productData.qty) : 0,
      price: productData.price ? Number(productData.price) : 0,
      discount: productData.discount ? Number(productData.discount) : 0,
      categoryId: productData.categoryId,
    };
    const createProduct = await product.create(data);
    if (createProduct) {
      res.send({ success: "Product added successfully" });
    } else {
      res.send({ error: "Something went wrong" });
    }
  }
});
router.post(
  "/create_location_viaCSV",
  upload.single("products"),
  (req, res, next) => {
    var failureArray = [];
    const csvFilePath = req.file.path;
    if (csvFilePath) {
      csv()
        .fromFile(csvFilePath)
        .then((jsonObj) => {
          var csvjson = jsonObj;
          // console.log("csvjson", JSON.stringify(csvjson));
          for (let i = 0, p = Promise.resolve(); i < csvjson.length; i++) {
            p = p.then(
              (_) =>
                new Promise((resolve) => {
                  var data = {
                    categoryId: csvjson[i].categoryId,
                    name: csvjson[i].name,
                    qty: Number(csvjson[i].qty),
                    price: csvjson[i].price,
                    discount: csvjson[i].discount,
                  };
                  var productData = new product(data);
                  productData.save(function (err, result) {
                    if (err) {
                      failureArray.push(data);
                      console.log(err);
                      resolve();
                    } else {
                      //console.log(result);
                      if (i == csvjson.length - 1) {
                        res.send({
                          Success: " CSV file Successfully Inserted",
                          failureArray: failureArray,
                        });
                      }
                      resolve();
                    }
                  });
                })
            );
          }
        });
    }
  }
);
// #endregion

// #region category section
router.get("/category", isValid, async function (req, res, next) {
  const categoryList = await category.find({});
  res.render("category", { title: "category", categoryList: categoryList });
});

router.post("/category-data", async function (req, res, next) {
  var categoryData = req.body;
  if (categoryData) {
    categoryData = JSON.parse(JSON.stringify(categoryData));
    var data = {
      name: categoryData.name,
      status: categoryData.status,
    };
    const createResponse = await category.create(data);
    if (createResponse) {
      res.send({ success: "category added successfully" });
    } else {
      res.send({ error: "Something went wrong" });
    }
  }
});
router.post("/category-update", async function (req, res, next) {
  var updateData = req.body;
  if (updateData) {
    updateData = JSON.parse(JSON.stringify(updateData));
    var data = {
      name: updateData.name,
      status: updateData.status,
    };
    const updateCategory = await category.update(
      { _id: updateData.id },
      { $set: data }
    );
    if (updateCategory) {
      res.send({ success: "category Updated successfully" });
    } else {
      res.send({ error: "Something went wrong" });
    }
  }
});
router.post("/category-delete", async function (req, res, next) {
  var id = req.body.id;
  if (id) {
    const deleteResponse = await category.remove({ _id: id });
    res.send({ success: "category deleted successfully" });
  } else {
    res.send({ error: "Id is required" });
  }
});
// #endregion

// #region Auth secton
router.get("/login", function (req, res, next) {
  res.render("login", { title: "Login" });
});
router.get("/logout", function (req, res, next) {
  res.clearCookie("token");
  res.render("login", { title: "Login" });
});
router.get("/signup", function (req, res, next) {
  res.render("signup", { title: "signup" });
});
router.post("/login-data", async function (req, res, next) {
  if (req.body) {
    req.body = JSON.parse(JSON.stringify(req.body));
    var email = req.body.email;
    var password = req.body.password;
    const isUserExist = await user.findOne({ email: email });
    if (isUserExist) {
      // email match
      bcrypt.compare(
        password,
        isUserExist.password,
        async function (err, result) {
          // result === true
          if (result) {
            //jwt
            await jwt.sign(
              {
                data: isUserExist,
              },
              "mysecret",
              { expiresIn: 60 * 60 },
              (err, token) => {
                if (err) {
                  console.log(err);
                } else {
                  res.cookie("token", token);
                  res.send({ success: "login success" });
                }
              }
            );
          } else {
            res.send({ error: "Password not match" });
          }
        }
      );
    } else {
      res.send({ error: "user not found" });
    }
  }
});
router.post("/signup-data", async function (req, res, next) {
  if (req.body) {
    req.body = JSON.parse(JSON.stringify(req.body));
    var email = req.body.email;
    const isUserExist = await user.findOne({ email: email });
    if (!isUserExist) {
      var password = req.body.password;
      bcrypt.genSalt(10, function (err, salt) {
        bcrypt.hash(password, salt, async function (err, hash) {
          // Store hash in your password DB.
          var data = {
            email: email,
            password: hash,
            status: "N",
            createdOn: Date.now(),
            updatedOn: Date.now(),
          };
          const createResponse = await user.create(data);
          if (createResponse) {
            res.send({ success: "user registered successfully" });
          } else {
            res.send({ error: "something went wrong" });
          }
        });
      });
    } else {
      res.send({ error: "user already exist" });
    }
  }
});
// #endregion

module.exports = router;
