def comparing_things(word1: str, word2: str) -> list[float]:
    """ word1 is the phoneme, word2 is the transcript
    """
    word2_cl = word2.replace('|', " ")
    word2_vec = word2_cl.split(" ")
    word1_vec = word1.split(" ")
    cache = [[0] * (len(word2_vec) + 1) for _ in range(len(word1_vec) + 1)]

    for j in range(len(word2_vec) + 1):
        cache[len(word1_vec)][j] = len(word2_vec) - j
    
    for i in range(len(word1_vec) + 1):
        cache[i][len(word2_vec)] = len(word1_vec) - i
    
    for i in range(len(word1_vec)-1,-1,-1):
        for j in range(len(word2_vec)-1,-1,-1):
            if word1_vec[i] == word2_vec[j]:
                cache[i][j] = cache[i + 1][j + 1]
            else:
                cache[i][j] = 1 + min(cache[i + 1][j],cache[i][j + 1],cache[i + 1][j + 1])

    res: list[str] = []
    w1_i = len(word1_vec)
    w2_i = len(word2_vec)
    while w1_i > 0 and w2_i > 0:
        # up
        up = cache[w1_i - 1][w2_i] if w1_i > 0 else float("inf")
        # left
        left = cache[w1_i][w2_i - 1] if w2_i > 0 else float("inf")
        # diagonal
        diagonal = cache[w1_i - 1][w2_i - 1] if w1_i > 0 and w2_i > 0 else float("inf")

        row = 0
        col = 0
        if up < left and up < diagonal:
            row = w1_i - 1
            col = w2_i
        elif left < up and left < diagonal:
            row = w1_i
            col = w2_i - 1
        else:
            row = w1_i - 1
            col = w2_i - 1
        
        if word1_vec[row] == word2_vec[col]:
            res.append(word1_vec[row])
        
        w1_i = row
        w2_i = col
    
    res.reverse()

    new_res: list[bool] = []
    res_i = 0
    for word in word2.split('|'):
        equal_letters = 0
        word_letters = 0
        for phone in word.split(" "):
            if res_i < len(res) and phone == res[res_i]:
                res_i += 1
                equal_letters+=1
            word_letters+=1
        new_res.append(equal_letters/word_letters)
    
    # this testcase is that \/, let's try only adding
    # if word 1 is < word 2 I can only add " " or substitute
    # if word 1 is > word 2 I can only "delete"
    return new_res
