const express = require('express');
const app = express();
const cors = require('cors');
const bcrypt = require('bcryptjs')
const User = require('./models/User')
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const CookieParser = require('cookie-parser');
const imageDownloader = require('image-downloader')
const cookieParser = require('cookie-parser');
const multer = require('multer');
const Place = require('./models/Place')
const fs = require('fs');
const Booking = require('./models/Booking');
const { resolve } = require('path');
const { rejects } = require('assert');
require('dotenv').config();


const bcryptSalt = bcrypt.genSaltSync(10)
const jwtSecret = 'gklsdjfioasdujrioasjiokadhgjklxnd'

app.use(express.json())
app.use(cookieParser())
app.use('/uploads', express.static(__dirname+'/uploads'))
app.use(cors({
  credentials: true,
  origin: 'http://localhost:5173'
}))


mongoose.connect(process.env.MONGO_URL)

function getUserDataFromReq(req){
  return new Promise((resolve, reject) => {
    jwt.verify(req.cookies.token, jwtSecret, {}, async (err, user) => {
      if(err) throw err;
      resolve(user)
    })
  })
}

app.get('/test', (req, res) => {
  res.json('test ok')
})
// vrmTi2VF69Gd4ZeR
app.post('/register', async (req, res) => {
  const {name, email, password} = req.body

  try {
    const userDoc = await User.create({
      name,
      email,
      password:bcrypt.hashSync(password, bcryptSalt)
    })
    res.json(userDoc)
    
  } catch (error) {
    res.status(422).json(error)
  }

})

app.post('/login', async (req, res) => {
  const { email, password } = req.body;
  const userDoc = await User.findOne({ email });

  if (userDoc) {
    const passOk = await bcrypt.compare(password, userDoc.password);

    if (passOk) {
      try {
        const token = await jwt.sign({ email: userDoc.email, id: userDoc._id }, jwtSecret);
        res.cookie('token', token).json(userDoc);
      } catch (err) {
        console.error(err);
        res.status(500).json('Internal Server Error');
      }
    } else {
      res.status(422).json('Incorrect password');
    }
  } else {
    res.status(404).json('User not found');
  }
});


app.get('/profile', (req, res) => {
  const {token} = req.cookies;
  if(token){
    jwt.verify(token, jwtSecret, {}, async (err, user) => {
      if(err) throw err
      const {name, email, _id} =  await User.findById(user.id)
      res.json({name, email, _id})
    });
  }else{
    res.json(null)
  }
})

app.post('/logout', (req, res) => {
  res.cookie('token', '').json(true)
})

app.post('/upload-by-link', async (req, res) => {
  const {link} = req.body
  const newName = 'photo' + Date.now() + '.jpg'
  await imageDownloader.image({
    url: link,
    dest: __dirname + '/uploads/' +newName
  })
  res.json(newName)
})

const photosMiddleware = multer({dest:'uploads/'});
app.post('/upload', photosMiddleware.array('photos', 100),(req, res) => {
  const uploadedFiles = []
  for (let i = 0; i < req.files.length; i++) {
    const {path, originalname} = req.files[i]
    const parts = originalname.split('.')
    const ext = parts[parts.length - 1]
    const newPath = path + '.' + ext
    fs.renameSync(path, newPath)
    uploadedFiles.push(newPath.replace(`uploads\\`, ''));
  }
  res.json(uploadedFiles)
});

app.post('/places', (req, res) => {
  const {token} = req.cookies;
  const {title, address, addedPhotos,
        description, perks, extraInfo,
        checkIn, checkOut, maxGuests,price} = req.body
  if(token){
    jwt.verify(token, jwtSecret, {}, async (err, user) => {
      if(err) throw err
      const placeDoc = await Place.create({
        owner:user.id,
        title, address, photos:addedPhotos,
        description, perks, extraInfo,
        checkIn, checkOut, maxGuests,price
      });
      res.json(placeDoc)
    });
  }
})

app.get('/user-places', (req, res) => {
  const {token} = req.cookies;
  jwt.verify(token, jwtSecret, {}, async (err, user) => {
    const {id} = user
    res.json(await Place.find({owner:id}))
  })
})

app.get('/places/:id', async (req, res) => {
  const {id} = req.params
  res.json(await Place.findById(id))
})

app.put('/places', async (req, res) => {
  const {token} = req.cookies;
  const {id,title, address, addedPhotos,
    description, perks, extraInfo,
    checkIn, checkOut, maxGuests,price} = req.body
  
  jwt.verify(token, jwtSecret, {}, async (err, user) => {
    if(err) throw err
    const placeDoc = await Place.findById(id)
    if(user.id === placeDoc.owner.toString()){
      placeDoc.set({
        title, address, photos:addedPhotos,
        description, perks, extraInfo,
        checkIn, checkOut, maxGuests,price
      })
      await placeDoc.save()
      res.json('ok')
    }
  });
});

app.get('/places', async (req, res) => {
  res.json(await Place.find())
})

app.post('/bookings', async (req, res) => {
  const userData = await getUserDataFromReq(req)
  const {place, checkIn, checkOut, numberOfGuests, name ,phone,price, } = req.body
  Booking.create({
    place, checkIn, checkOut, numberOfGuests, name ,phone,price,user:userData.id
  }).then((doc) => {
    
    res.json(doc)
  }).catch(err  => {
    throw err
  });
  
})



app.get('/bookings', async (req, res) => {
  const userData = await getUserDataFromReq(req)
  res.json(await Booking.find({user:userData.id}).populate('place'))
})

app.delete('/delete-place/:placeId', async (req, res) => {
  try {
    const id = req.params.placeId;

    
    const result = await Place.findByIdAndDelete(id);

    if (result) {
      res.status(200).json({ message: "Place deleted successfully" });
    } else {
      res.status(404).json({ message: "Place not found" });
    }
  } catch (error) {
    console.error("Error deleting place:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

app.delete('/delete-booking/:bookingId', async (req, res) => {
  const id = req.params.bookingId
  await Booking.findByIdAndDelete(id)
})




app.listen(4000)