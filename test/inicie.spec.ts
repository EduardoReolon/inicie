import test from 'japa'
import { string } from '@ioc:Adonis/Core/Helpers'
import supertest from 'supertest'

const BASE_URL = 'https://gorest.co.in/public/v2/'
// O token ficaria nas variáveis de ambiente, deixei aqui para facilitar para o avaliador
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

// dados a serem inseridos na base
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

/**
 * Para não visualizar todas as páginas, e agilizar o teste
 * 0-exibe todas as páginas
 */
const maxPagesToList = 3;

test.group('Inicie tests', async () => {
  // cria o usuário na base
  await new Promise((resolve) => {
    test('Create user', async (assert) => {
      // O domínio é uma string aleatória, para o caso de precisar rodar mais de 1 vez o mesmo teste
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

  // lista todos os usuários da base e exibe aquele recem criado
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
        // exibe cada página
        console.log('Users ids', response._body.map((u) => u.id), 'Page', currentPage);
        usersInPage = response._body.length;
        if (!userServer) userServer = response._body.find((u) => u.id === user.id);
      } while (usersInPage && (!maxPagesToList || currentPage < maxPagesToList));
      // exibe o usuário recem criado, que veio da busca
      console.log('User in server', userServer);
      resolve('Success!');
    }).timeout(0)
  })

  // novo post para o usuário
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

  // função para inserir comentário em um post. Para não repetir código
  async function newComment(post_id, comment) {
    await new Promise(async (resolve) => {
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
        resolve('Success!');
      })
    });
  }
  
  // criar comentário para o post do usuário
  await newComment(postUser.id, commentUser);

  // buscar primeira página dos posts da base
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

  // criar comentário para o primeiro post da base
  await newComment(firstPost.id, commentFirstPost);

  // apagar o comentário recem criado
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
