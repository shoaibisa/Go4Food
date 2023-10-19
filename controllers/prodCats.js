const express = require('express');
const {Category} = require('../model/category');
const {findByIdAndRemove} = require('../model/role');
const router = express.Router;

router.get('/', async (req, res) =>
{
    const categoryList = await = Category.find();

    if (!categoryList)
    {
        res.status(500),json({success: false})
    }

    res.send(categoryList);
})

router.post('/', async (req, res) =>
{
    let category = new Category
    ({
        name: req.body.name,
    })
    
    category = await category.save();
    
    if (!category)
    {
        return res.status(404).send('Product Category cannot be created.')
    }

    res.send(category);
})

router.delete('/catID', async (req, res) =>
{
    Category.findByIdAndDelete(req.params.catID).then(category =>
    {
        if (category) 
        {
            return res.status(200).json
            ({
                success: true, 
                message: "Category has been succesfully deleted.",  
            })
        }
        else
        {
            return res.status(404).json
            ({
                success: false, 
                message: "Category is not found.",  
            })
        }
    })
})

module.exports = router;