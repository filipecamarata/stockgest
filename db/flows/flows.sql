
-- flows
-- pegando todos os produtos da categoria alimentos
select * from products where category_id = 1;

-- pegando todos os produtos da categoria alimentos e com quantidade abaixo de 5
select * from products where category_id = 1 and amount <= 5;

-- pegando todos os produtos da categoria alimentos e com quantidade acima de 5
select * from products where category_id = 1 and amount > 5;


-- pegando todos os produtos da categoria alimentos
select * from products where category_id = 2;

-- pegando todos os produtos da categoria produtos de limpeza e com quantidade abaixo de 5
select * from products where category_id = 2 and amount <= 5;

-- pegando todos os produtos da categoria produtos de limpeza e com quantidade acima de 5
select * from products where category_id = 2 and amount > 5;


