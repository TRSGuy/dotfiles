import random
rand_arr = []
done = False
target_len = 100
while len(rand_arr) < target_len:
	randint = random.randint(0, 100)
	if not(randint in rand_arr):
		rand_arr.append(randint)
	print(len(rand_arr))
	print(randin)
print(rand_arr)
