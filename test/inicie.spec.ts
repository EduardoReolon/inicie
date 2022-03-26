import test from 'japa'
import { string } from '@ioc:Adonis/Core/Helpers'
import supertest from 'supertest'

const BASE_URL = 'https://gorest.co.in/public/v2/'
const token = 'b5e34cbc526e9e044144fe3f019d948ea27c324ad6905897a0b982d015027d75';
const header = {
  Authorization: `Bearer ${token}`,
  'Content-Type': 'application/json',
};
async function str_random(length = 5) {
  // gera uma string aleatória
  const bytes = await string.generateRandom(length)
  const buffer = Buffer.from(bytes)
  return buffer
    .toString('base64')
    .replace(/[^a-zA-Z0-9]/g, '')
}
const user:{id?,name,gender,email?,status} = {
  name: 'Tenali Ramakrishna',
  gender: 'male',
  status:'active',
};
const postUser:{id?,title,body} = {
  title: 'Any title',
  body: 'Any body content',
};
const commentUser:{id?,body} = {
  body: 'Any body content for the user comment',
}
let firstPost:{id,user_id,title,body};
const commentFirstPost:{id?,body} = {
  body: 'Any body content for the first post',
}
// caso não queira exibir todos os usuários do banco
const maxPagesToList = 1;

test.group('Inicie tests', async () => {
  await new Promise((resolve) => {
    test('Create user', async (assert) => {
      user.email = `tenali.ramakrishna@${await str_random()}.com`;
      const response = await supertest(BASE_URL).post('users')
        .send(user)
        .set(header)
        .expect(201) as any
      assert.exists(response._body);
      assert.exists(response._body.id);
      user.id = response._body.id;
      console.log('User data', user);
      resolve('Success!');
    })
  })

  await new Promise((resolve) => {
    test('List all users', async (assert) => {
      let currentPage = 0;
      let usersInPage = 0;
      let userServer;
      do {
        currentPage += 1;
        const response = await supertest(BASE_URL).get(`users?page=${currentPage}`)
          .set(header)
          .expect(200) as any;
        assert.exists(response._body);
        assert.isArray(response._body);
        console.log('Users ids', response._body.map((u) => u.id), 'Page', currentPage);
        usersInPage = response._body.length;
        if (!userServer) userServer = response._body.find((u) => u.id === user.id);
      } while (usersInPage && currentPage < maxPagesToList);
      console.log('User in server', userServer);
      resolve('Success!');
    }).timeout(0)
  })

  await new Promise((resolve) => {
    test('New post for the user', async (assert) => {
      const response = await supertest(BASE_URL).post('posts')
        .send({
          ...postUser,
          user_id: user.id
        })
        .set(header)
        .expect(201) as any;
      assert.exists(response._body);
      assert.exists(response._body.id);
      postUser.id = response._body.id;
      console.log('Post created', response._body);
      resolve('Success!');
    })
  });

  function newComment(post_id, comment) {
    test('New comment', async (assert) => {
      const response = await supertest(BASE_URL).post('comments')
        .send({
          ...comment,
          post_id,
          name: user.name,
          email: user.email,
        })
        .set(header)
        .expect(201) as any
      assert.exists(response._body);
      assert.exists(response._body.id);
      comment.id = response._body.id;
      console.log('Comment created', response._body);
    })
  }
  
  await new Promise(async (resolve) => {
    await newComment(postUser.id, commentUser);
    resolve('Success!');
  });

  await new Promise((resolve) => {
    test('Get all posts', async (assert) => {
      const response = await supertest(BASE_URL).get('posts')
        .set(header)
        .expect(200) as any
      assert.exists(response._body);
      assert.isArray(response._body);
      firstPost = response._body[0];
      console.log('First post in server', firstPost);
      resolve('Success!');
    })
  });

  await new Promise(async (resolve) => {
    await newComment(firstPost.id, commentFirstPost);
    resolve('Success!');
  });

  await new Promise((resolve) => {
    test('Delete comment', async () => {
      await supertest(BASE_URL).delete(`comments/${commentFirstPost.id}`)
        .set(header)
        .expect(204) as any;
      console.log('Comment deleted');
      resolve('Success!');
    })
  })
})
