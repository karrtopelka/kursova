const fs = require('fs');
const {
  femaleNames,
  maleNames,
  lastNames,
  maleAvatars,
  femaleAvatars,
} = require('./staticDataForGenerator');

const about =
  'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed gravida fringilla quam vel tristique. Pellentesque vel ligula sit amet justo pulvinar porta. Cras rutrum elit at justo ultrices, sit amet ultrices metus lacinia. Vivamus condimentum mi ut dolor tristique, nec suscipit nibh consectetur. Aliquam dictum pellentesque nisi, quis bibendum felis consequat ut. Proin sodales felis id pretium pellentesque. Aliquam porta congue blandit. Maecenas porttitor tincidunt metus, vitae cursus odio pulvinar vel. Phasellus mi turpis, finibus in.';

const lookingfor = {
  male: ['female', 'female', 'female', 'male', 'female'],
  female: ['male', 'male', 'male', 'female', 'male'],
};

const getRandomIntInclusive = (min, max, prev) => {
  min = Math.ceil(min);
  max = Math.floor(max);
  if (prev) {
    let current = 0;
    while (prev >= current) {
      current = Math.floor(Math.random() * (max - min + 1) + min);
    }

    return current;
  }
  return Math.floor(Math.random() * (max - min + 1) + min);
};

let fullUsersList = [];

const buildUser = (amount) => {
  let users = [];
  for (let index = 0; index < amount; index++) {
    const lowerAge = getRandomIntInclusive(18, 25);
    const gender = index < Math.floor(amount / 2) ? 'male' : 'female';

    const username =
      gender === 'male'
        ? `${maleNames[Math.floor(Math.random() * maleNames.length)]}${
            lastNames[Math.floor(Math.random() * lastNames.length)]
          }`.toLowerCase()
        : `${femaleNames[Math.floor(Math.random() * femaleNames.length)]}${
            lastNames[Math.floor(Math.random() * lastNames.length)]
          }`.toLowerCase();

    const avatar =
      gender === 'male'
        ? maleAvatars[Math.floor(Math.random() * maleAvatars.length)]
        : femaleAvatars[Math.floor(Math.random() * femaleAvatars.length)];

    users.push({
      email: `${username}@${username}.com`,
      username,
      password: '123123123',
      gender,
      avatar,
      about,
      age: getRandomIntInclusive(18, 35),
      ages: { from: lowerAge, to: getRandomIntInclusive(18, 35, lowerAge) },
      lookingfor:
        lookingfor[gender][
          Math.floor(Math.random() * lookingfor[gender].length)
        ],
      education: 'LNU',
      work: 'bartender',
    });
  }

  return users;
};

fullUsersList.push(...buildUser(100));

fs.writeFile('./users.json', JSON.stringify(fullUsersList), function (err) {
  if (err) {
    console.log(err);
  }
});
