const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");

const app = express();

app.set('view engine', 'ejs');
mongoose.connect("mongodb://127.0.0.1:27017/todolistDB");
app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

const itemsSchema = new mongoose.Schema({
  name:String
});

const Item = mongoose.model("Item",itemsSchema);

const item1 = new Item({
  name:"Welcome to your To Do List"
});

const item2 = new Item({
  name:"click ' + ' icon to add new item"
});

const item3 = new Item({
  name:"<-- hit this to delete an item"
});

const defaultItems = [item1,item2,item3];

const listSchema = new mongoose.Schema({
  name:String,
  items:[itemsSchema]
});

const List = mongoose.model("List", listSchema);

app.get("/", function(req, res){
  Item.find().then(
    function(items){
      if (items.length === 0) {
        Item.insertMany(defaultItems).then(function(){console.log("sucess");}).catch(function(err){console.log(err);});
        res.redirect("/");
      }else{
      res.render("list", {listTitle: "Today", newListItems:items});
    }})
});

app.get("/:customListName",function(req,res){
  const customListName = _.capitalize(req.params.customListName);
  List.findOne({name:customListName}).then(
    function(foundList){
        if(!foundList){
          const list = new List({
            name:customListName,
            items: defaultItems
          });
          list.save();
          res.redirect("/"+ customListName);
        }else{
          res.render("list", {listTitle: foundList.name, newListItems:foundList.items});
        }
      }
  );
});

app.post("/", function(req, res){

  const itemName = req.body.newItem;
  const listName = req.body.list;

  const item = new Item({
    name:itemName
  });

  if (listName === "Today") {
    item.save();
  res.redirect("/");
  }else{
    List.findOne({name:listName}).then(
      function(foundList){
        foundList.items.push(item);
        foundList.save();
        res.redirect("/" + listName);
      }
    );
  }
});

app.post("/delete",function(req,res){
  const checkedId = req.body.checkbox;
  const listName = req.body.listName;

  if (listName === "Today") {
    Item.findByIdAndRemove(checkedId).then(
      function(){console.log("success to delete");}
    ).catch(
      function(err){console.log(err);}
    );
    res.redirect("/");
  }else{
    List.findOneAndUpdate({name : listName},
      {$pull: {items : {_id : checkedId}}}).then(function(){
        res.redirect("/" + listName);
      });
  }
});

app.listen(3000, function() {
  console.log("Server started on port 3000");
});
