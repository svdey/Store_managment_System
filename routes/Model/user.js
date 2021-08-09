const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const ObjectId = Schema.ObjectId;

const userSchema = new Schema({
  email: { type: String, default: null, required: true },
  password: { type: String, default: null, required: true },
  status: { type: String, default: null, required: true }, //Y=Active,N=non-active,T=Trash
  createdOn: { type: Date, default: Date.now(), required: true },
  updatedOn: { type: Date, default: Date.now(), required: true },
});
module.exports = mongoose.model("user", userSchema);
