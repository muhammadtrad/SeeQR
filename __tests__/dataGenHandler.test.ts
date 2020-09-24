import { createInsertQuery } from "../backend/dummy_db/dataGenHandler";

const mockObj1 = {
  table : 'table1',
  scale : 5,
  columns : [
    {
      name : '_id',
      dataCategory : 'unique', // random, repeating, unique, combo, foreign
      dataType : 'num',
      data : {
        serial: true,
      }
    }
  ]
};

test("insert number query test", () => {
  expect(createInsertQuery(mockObj1)[0].trim()).toBe('INSERT INTO "table1"(_id) VALUES (0), (1), (2), (3), (4);');
});


const mockObj2 = {
  table : 'table1',
  scale : 5,
  columns : [
    {
      name : 'username',
      dataCategory : 'unique', // random, repeating, unique, combo, foreign
      dataType : 'str',
      data : {
        minLen : 10,
        maxLen : 15,
        inclAlphaLow : true,
        inclAlphaUp : true,
        inclNum : true,
        inclSpaces : true,
        inclSpecChar : true,
        include : [],
      },
    },
  ]
};

test("insert string query test", () => {
  expect(typeof createInsertQuery(mockObj2)[0]).toBe('string');
});

const mockObj3 = {
  table : 'table1',
  scale : 1,
  columns : [
    {
      name : 'first_name',
      dataCategory : 'random', // random, repeating, unique, combo, foreign
      dataType : 'Name - firstName',
      data : {
      }
    }
  ]
};

test("insert name query test", () => {
  console.log(createInsertQuery(mockObj3));
  expect(typeof createInsertQuery(mockObj3)[0]).toBe('string');
});
