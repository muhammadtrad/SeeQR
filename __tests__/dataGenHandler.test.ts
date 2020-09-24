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
    },
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
        include : ["include", "these", "abReplace"],
      },
    },
    {
      name : 'first_name',
      dataCategory : 'random', // random, repeating, unique, combo, foreign
      dataType : 'Name - firstName',
      data : {
      }
    }
  ]
};

test("", () => {
  expect(createInsertQuery(mockObj)).toBe([]);
});