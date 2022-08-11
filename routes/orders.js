const {Router} = require('express')
const auth = require('../middleware/auth')
const router = Router()
const Order = require('../models/order')

router.get('/', auth, async (req, res) => {
    try {
        const orders = await Order.find({
            'user.userId': req.user._id
        }).populate('user.userId').lean()

        const resOrder = orders.map(o => {
            return {
                ...o,
                price: o.courses.reduce((total, c) => {
                    return total += c.count * c.course.price
                }, 0)
            }
        })
        
        res.render('orders', {
            isOrder: true,
            title: 'Заказы',
            orders: resOrder
        })
    } catch (e) {
        console.log(e)
    }
    
})

router.post('/', auth, async (req, res) => {
    const user = await req.user.populate('cart.items.courseId')
    const courses = user.cart.items.map(i => ({
        count: i.count,
        course: {...i.courseId}
    }))

    const order = new Order({
        user: {
            name: req.user.name,
            userId: req.user
        },
        courses: courses
    })
    
    await order.save()
    await req.user.clearCart()

    res.redirect('/orders')
})

module.exports = router