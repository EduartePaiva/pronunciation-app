[x] - comparison algorithm need to be build to compare the two phoneme strings
[x] - first of all, just detect witch word is wrong and witch word is right.
[x] - first I'll do if any phoneme is wrong the word is wrong, else right.
[x] - then I'll introduce the threshold limit of 70% but still showing wrong or right.
[x] - then after that start detecting at the phoneme level
[_] - then I'll start showing the silabas of phones that the person pronounced wrong. (phones would be easier, silabas I would have to map them to phones probably) 

[_] now I have to build realtime streaming, first add socketIo to it somehow, for this I'll create a branch in the project
[_] let's try doing things slowly, first I'll try realtime phones translating, I could even offload to the client the leven distance task.