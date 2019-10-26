'use strict';

const express = require('express');

const app = express();
app.enable('trust proxy');

// Body parser

var bodyParser = require('body-parser');
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
  extended: true
}));

const admin = require('firebase-admin');

admin.initializeApp({
  credential: admin.credential.applicationDefault()
});

const firestore = admin.firestore();

// GEO Parser
const {
  GeoFirestore
} = require('geofirestore');

const geofirestore = new GeoFirestore(firestore);

const driverGeoCollection = geofirestore.collection('drivergeolocations');
const animalGeoCollection = geofirestore.collection('animalgeolocations');
const regularDriverGeoCollection = firestore.collection('drivergeolocations');
const regularAnimalGeoCollection = firestore.collection('animalgeolocations');

app.get('/', async (req, res, next) => {
  res.status(200)
    .json({
      status: 200
    })
    .end();
});

// POST http://localhost:8080/api/updatelocation
/*
{
  id: string,
  type: "animal" / "driver",
  lat: double,
  long: double
}
*/

app.post('/api/updatelocation', function (req, res) {

  var id = req.body.id;
  var type = req.body.type;
  var lat = Number(req.body.lat);
  var long = Number(req.body.long);
  var ts = Math.round((new Date()).getTime() / 1000);
  
  if (type === 'driver') {
    regularDriverGeoCollection.where(`d.deviceId`, '==', id).get()
      .then(snapshot => {
        if (snapshot.empty) {
          console.log('No matching documents.');
          driverGeoCollection.add({
            deviceId: id,
            coordinates: new admin.firestore.GeoPoint(lat, long),
            updatedAt: ts
          })
          res.status(200)
            .json({
              status: true
            })
            .end();
          return;
        }

        driverGeoCollection.doc(snapshot.docs[0].id).update({
          coordinates: new admin.firestore.GeoPoint(lat, long),
          updatedAt: ts
        }).then(() => {
          res.status(200)
            .json({
              status: true
            })
            .end();
        }, (error) => {
          console.log('Error: ' + error);
          res.status(400)
            .json({
              status: false
            })
            .end();
        });
      })
      .catch(err => {
        console.log('Error getting documents', err);
        res.status(400)
          .json({
            status: false
          })
          .end();
      });
  } else if (type === 'animal') {
    regularAnimalGeoCollection.where(`d.deviceId`, '==', id).get()
      .then(snapshot => {
        if (snapshot.empty) {
          console.log('No matching documents.');
          animalGeoCollection.add({
            deviceId: id,
            coordinates: new admin.firestore.GeoPoint(lat, long),
            updatedAt: ts
          })
          res.status(200)
            .json({
              status: true
            })
            .end();
          return;
        }

        animalGeoCollection.doc(snapshot.docs[0].id).update({
          coordinates: new admin.firestore.GeoPoint(lat, long),
          updatedAt: ts
        }).then(() => {
          res.status(200)
            .json({
              status: true
            })
            .end();
        }, (error) => {
          console.log('Error: ' + error);
          res.status(400)
            .json({
              status: false
            })
            .end();
        });
      })
      .catch(err => {
        console.log('Error getting documents', err);
        res.status(400)
          .json({
            status: false
          })
          .end();
      });
  } else {
    res.status(405)
      .json({
        message: 'Wrong type'
      })
      .end();
  }
});

// GET http://localhost:8080/api/getnearbyanimals
/*
Params: lat, long, radius
*/

app.get('/api/getnearbyanimals', function (req, res) {
  var lat = Number(req.param('lat'));
  var long = Number(req.param('long'));
  var radius = Number(req.param('radius'));

  const query = animalGeoCollection.near({
    center: new admin.firestore.GeoPoint(lat, long),
    radius: radius
  });

  query.get().then(value => {
    res.status(200)
      .json(value.docs)
      .end();
  });
});

const PORT = process.env.PORT || 8080;
app.listen(process.env.PORT || 8080, () => {
  console.log(`App listening on port ${PORT}`);
  console.log('Press Ctrl+C to quit.');
});

module.exports = app;