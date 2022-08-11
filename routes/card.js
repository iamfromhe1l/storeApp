const {Router} = require('express')
const Course = require('../models/course')
const auth = require('../middleware/auth')
const router = Router()

function mapCartItems(cart) {
  return cart.items.map(c => ({
    ...c.courseId._doc, count: c.count, allPrice: c.count*c.courseId.price
  }))
}

function getPrice(courses) {
  return courses.map(e => e.allPrice).reduce((acc, cur) => acc + cur)
}

router.post('/add', auth, async (req, res) => {
  const course = await Course.findById(req.body.id).lean()
  await req.user.addToCart(course)
  res.redirect('/card')
})

router.delete('/remove/:id', auth, async (req, res) => {
  await req.user.removeFromCart(req.params.id)
  const user = await req.user.populate('cart.items.courseId')
  const courses = mapCartItems(user.cart)
  const cart = {
    courses, price: getPrice(courses)
  }
  res.status(200).json(cart)
})

router.get('/', auth, async (req, res) => {
  const user = await req.user
    .populate('cart.items.courseId')
  
  const courses = mapCartItems(user.cart)

  let price = 0
  if (courses.length) {
    price = getPrice(courses)
  }
  

  res.render('card', {
    title: 'Корзина',
    isCard: true,
    courses: courses,
    price: price
  })
})

module.exports = router