// scratch/add_midterm_cheatsheets.mjs
import fs from 'fs';
import path from 'path';

const cheatsheetFilePath = path.resolve('src/data/cheatsheets.js');
let content = fs.readFileSync(cheatsheetFilePath, 'utf8');

const midtermCheatsheetsCode = `
export const MIDTERM_CHEATSHEETS = {
  Topic1: {
    lectureId: 'Topic1',
    title: 'Topic 1: Data Types, Operators & Strings',
    subtitle: 'Type conversion, arithmetic operations, slicing, and string manipulation methods',
    categories: [
      {
        id: 'data_types',
        name: 'Data Types & Casting',
        icon: 'Layers',
        items: [
          {
            title: 'Type Casting & Conversion',
            syntax: 'int(x), float(x), str(x), bool(x)',
            code: \`# Convert between primitive data types
n = int("42")          # 42
f = float("3.14")      # 3.14
s = str(100)           # "100"
b = bool(1)            # True (0, "", [], None are False)
print(n, f, s, b)\`,
            description: 'Convert values between integer, float, string, and boolean types.',
            note: 'Empty collections, 0, and None evaluate to False in bool().'
          },
          {
            title: 'Type Checking',
            syntax: 'type(x), isinstance(x, class_or_tuple)',
            code: \`x = [1, 2, 3]
print(type(x) is list)               # True
print(isinstance(x, (list, tuple)))  # True (checks inheritance/multiple types)\`,
            description: 'Check the runtime type of a variable or object.',
            note: 'Prefer isinstance() over type() as it supports inheritance and multiple types.'
          }
        ]
      },
      {
        id: 'operators',
        name: 'Arithmetic & Math Operators',
        icon: 'Bookmark',
        items: [
          {
            title: 'Floor Division & Modulo',
            syntax: 'a // b, a % b',
            code: \`# Floor division and remainder
quotient = 17 // 5     # 3 (integer part)
remainder = 17 % 5    # 2 (remainder)
print(f"Quotient: {quotient}, Remainder: {remainder}")\`,
            description: 'Perform integer floor division and calculate remainder modulo.',
            note: 'Useful for parity checks (x % 2 == 0) and digit extraction.'
          },
          {
            title: 'Divmod Combined Operation',
            syntax: 'divmod(a, b)',
            code: \`# Returns (a // b, a % b) simultaneously
q, r = divmod(17, 5)
print(f"q = {q}, r = {r}")  # q = 3, r = 2\`,
            description: 'Calculate quotient and remainder in a single efficient operation.',
            note: 'Faster than calculating // and % separately in loops.'
          },
          {
            title: 'Absolute Value & Rounding',
            syntax: 'abs(x), round(x, ndigits=None)',
            code: \`diff = abs(-15.6)       # 15.6
pi_approx = round(3.14159, 2)  # 3.14
print(diff, pi_approx)\`,
            description: 'Compute absolute value and round floating-point numbers to n decimal places.',
            note: 'Python uses bankers rounding (round-half-to-even) for ties.'
          }
        ]
      },
      {
        id: 'string_slicing',
        name: 'String Slicing & Indexing',
        icon: 'FileCode',
        items: [
          {
            title: 'String Indexing & Negative Indices',
            syntax: 's[index]',
            code: \`s = "Python"
first = s[0]    # 'P'
last = s[-1]    # 'n'
second_last = s[-2]  # 'o'
print(first, last, second_last)\`,
            description: 'Access individual characters by 0-based or negative index.',
            note: 'Strings in Python are immutable; s[0] = "J" raises TypeError.'
          },
          {
            title: 'Substrings with Slicing',
            syntax: 's[start:end:step]',
            code: \`s = "Hello, World!"
sub = s[0:5]        # 'Hello' (end index is exclusive)
every_second = s[::2] # 'Hlo ol!'
print(sub, every_second)\`,
            description: 'Extract a portion of a string with start, stop, and step parameters.',
            note: 'Omitted start defaults to 0; omitted end defaults to string length.'
          },
          {
            title: 'Reverse String with Step -1',
            syntax: 's[::-1]',
            code: \`text = "mirror"
reversed_text = text[::-1]
print(reversed_text)  # "rorrim"
# Palindrome check
is_palindrome = (text == text[::-1])
print("Is palindrome:", is_palindrome)\`,
            description: 'Reverse a string completely in a single slice expression.',
            note: 'The most idiomatic and fastest way to reverse a string in Python.'
          }
        ]
      },
      {
        id: 'string_methods',
        name: 'String Methods',
        icon: 'FileText',
        items: [
          {
            title: 'Split String into List',
            syntax: 's.split(sep=None, maxsplit=-1)',
            code: \`# Split by whitespace or custom delimiter
words = "apple banana orange".split()
csv_row = "101,John,Math".split(",")
print(words)    # ['apple', 'banana', 'orange']
print(csv_row)  # ['101', 'John', 'Math']\`,
            description: 'Split string by delimiter into a list of substrings.',
            note: 's.split() with no argument collapses consecutive whitespaces.'
          },
          {
            title: 'Join List into String',
            syntax: 'sep.join(iterable)',
            code: \`words = ["Data", "Science", "2026"]
sentence = " ".join(words)
csv_line = ",".join(words)
print(sentence)  # "Data Science 2026"
print(csv_line)  # "Data,Science,2026"\`,
            description: 'Concatenate a list of strings using a specified separator.',
            note: 'All elements in the iterable must be strings, or convert with map(str, lst).'
          },
          {
            title: 'Strip Leading/Trailing Characters',
            syntax: 's.strip(chars=None)',
            code: \`raw_input = "   hello world \\n"
clean = raw_input.strip()
print(repr(clean))  # 'hello world'
# Strip specific characters:
filename = "___data.csv___".strip("_")
print(filename)     # 'data.csv'\`,
            description: 'Remove whitespace or specified characters from both ends of string.',
            note: 'Use lstrip() for left side only, or rstrip() for right side only.'
          },
          {
            title: 'Replace Substrings',
            syntax: 's.replace(old, new, count=-1)',
            code: \`text = "one potato, two potato"
result = text.replace("potato", "tomato")
print(result)  # "one tomato, two tomato"\`,
            description: 'Return a copy with all occurrences of substring old replaced by new.',
            note: 'Optional count parameter limits the number of replacements.'
          },
          {
            title: 'Count & Find Substrings',
            syntax: 's.count(sub), s.find(sub)',
            code: \`text = "banana"
cnt = text.count("an")    # 2
idx = text.find("nan")    # 2 (-1 if not found)
print(f"Count: {cnt}, Position: {idx}")\`,
            description: 'Count occurrences of substring, or find lowest index where sub is found.',
            note: 'find() returns -1 when not found; index() raises ValueError.'
          },
          {
            title: 'String Validation & Cases',
            syntax: 's.isdigit(), s.isalpha(), s.lower(), s.upper()',
            code: \`print("12345".isdigit())     # True
print("Python".isalpha())    # True
print("Data2026".isalnum())  # True
print("HELLO".lower())       # "hello"
print("world".upper())       # "WORLD"\`,
            description: 'Inspect character categories and transform letter cases.',
            note: 'Useful for input validation and case-insensitive comparisons.'
          },
          {
            title: 'F-String Formatting',
            syntax: 'f"...{expr:spec}..."',
            code: \`score = 8.6666
name = "Alice"
rank = 1
msg = f"Student: {name}, Score: {score:.2f}, Rank: {rank:03d}"
print(msg)  # "Student: Alice, Score: 8.67, Rank: 001"\`,
            description: 'Format values directly inside string literals with format specifiers.',
            note: 'Use :.2f for decimals, :03d for zero-padded integers.'
          }
        ]
      }
    ]
  },
  Topic2: {
    lectureId: 'Topic2',
    title: 'Topic 2: Lists & Comprehensions',
    subtitle: 'List creation, mutation, sorting, built-in aggregations, and list comprehensions',
    categories: [
      {
        id: 'list_basics',
        name: 'List Creation & Slicing',
        icon: 'Layers',
        items: [
          {
            title: 'Initialize 1D and 2D Lists',
            syntax: '[val] * n, [[val] * m for _ in range(n)]',
            code: \`# 1D list of zeros:
zeros = [0] * 5
print(zeros)  # [0, 0, 0, 0, 0]

# 2D Grid / Matrix (n rows, m cols):
n, m = 3, 4
grid = [[0] * m for _ in range(n)]
grid[0][1] = 9
print(grid)\`,
            description: 'Initialize fixed-length lists and nested 2D matrices.',
            note: 'Never use [[0] * m] * n for 2D lists because rows will reference the same object.'
          },
          {
            title: 'List Slicing & Copying',
            syntax: 'lst[start:end], lst[:], lst[::-1]',
            code: \`nums = [10, 20, 30, 40, 50]
clone = nums[:]       # Shallow copy
first_three = nums[:3] # [10, 20, 30]
reversed_nums = nums[::-1] # [50, 40, 30, 20, 10]
print(clone, first_three, reversed_nums)\`,
            description: 'Extract sublists, create shallow copies, or reverse elements.',
            note: 'nums[:] creates a new list with the same elements, protecting original list.'
          }
        ]
      },
      {
        id: 'list_methods',
        name: 'List Mutation Methods',
        icon: 'FileCode',
        items: [
          {
            title: 'Add Elements (append & extend)',
            syntax: 'lst.append(x), lst.extend(iterable)',
            code: \`lst = [1, 2]
lst.append(3)          # [1, 2, 3] (adds item)
lst.extend([4, 5])     # [1, 2, 3, 4, 5] (appends all elements)
print(lst)\`,
            description: 'Append a single element or extend the list with all elements from another iterable.',
            note: 'append([4,5]) would nest a list inside; extend([4,5]) adds individual items.'
          },
          {
            title: 'Insert & Remove Elements',
            syntax: 'lst.insert(i, x), lst.remove(x), lst.pop(i)',
            code: \`lst = ['a', 'b', 'c', 'd']
lst.insert(1, 'X')     # ['a', 'X', 'b', 'c', 'd']
lst.remove('c')        # ['a', 'X', 'b', 'd'] (removes first 'c')
last_item = lst.pop()  # removes and returns 'd'
second = lst.pop(1)    # removes and returns 'X'
print(lst, last_item, second)\`,
            description: 'Insert element at specific position, remove by value, or remove by index with pop().',
            note: 'pop() defaults to index -1 (the last element). remove() raises ValueError if not found.'
          },
          {
            title: 'In-place Reverse & In-place Sort',
            syntax: 'lst.reverse(), lst.sort(reverse=False, key=None)',
            code: \`nums = [5, 2, 9, 1]
nums.reverse()         # [1, 9, 2, 5] (reversed in-place)
nums.sort()            # [1, 2, 5, 9] (sorted ascending in-place)
nums.sort(reverse=True)# [9, 5, 2, 1] (sorted descending)
print(nums)\`,
            description: 'Modify the original list in-place without creating a new copy.',
            note: 'Both methods return None; do not assign result to a variable (e.g. x = lst.sort()).'
          }
        ]
      },
      {
        id: 'list_builtins',
        name: 'Built-in Functions with Lists',
        icon: 'Bookmark',
        items: [
          {
            title: 'Sorted Function',
            syntax: 'sorted(iterable, reverse=False, key=None)',
            code: \`words = ["banana", "pie", "apple", "cherry"]
sorted_words = sorted(words, key=len)
print(sorted_words)  # ['pie', 'apple', 'banana', 'cherry']
# Original list remains unchanged
print(words)\`,
            description: 'Return a new sorted list from the elements of any iterable.',
            note: 'Unlike list.sort(), sorted() leaves the original collection untouched.'
          },
          {
            title: 'Aggregations (len, sum, min, max)',
            syntax: 'len(lst), sum(lst), min(lst), max(lst)',
            code: \`scores = [75, 90, 85, 95, 60]
total = sum(scores)            # 405
count = len(scores)            # 5
average = total / count        # 81.0
highest = max(scores)          # 95
lowest = min(scores)           # 60
print(f"Avg: {average}, Max: {highest}, Min: {lowest}")\`,
            description: 'Compute total count, summation, minimum, and maximum of sequence elements.',
            note: 'sum() accepts optional start value: sum(lst, 10).'
          },
          {
            title: 'Enumerate with Index',
            syntax: 'enumerate(iterable, start=0)',
            code: \`fruits = ["apple", "banana", "cherry"]
for idx, item in enumerate(fruits, start=1):
    print(f"{idx}. {item}")
# 1. apple \\n 2. banana \\n 3. cherry\`,
            description: 'Iterate over sequence yielding a tuple of (index, element) on each step.',
            note: 'Eliminates the need for manual counter variables or range(len(lst)).'
          },
          {
            title: 'Zip Parallel Iteration',
            syntax: 'zip(*iterables)',
            code: \`names = ["Alice", "Bob", "Charlie"]
scores = [85, 92, 78]
for name, score in zip(names, scores):
    print(f"{name}: {score}")
# Convert to dictionary:
name_score_dict = dict(zip(names, scores))
print(name_score_dict)\`,
            description: 'Combine multiple iterables element-by-element into tuples.',
            note: 'Stops when the shortest input iterable is exhausted.'
          },
          {
            title: 'Any & All Boolean Checks',
            syntax: 'any(iterable), all(iterable)',
            code: \`grades = [8, 9, 7, 10, 6]
has_perfect_score = any(g == 10 for g in grades) # True
all_passed = all(g >= 5 for g in grades)         # True
print(has_perfect_score, all_passed)\`,
            description: 'Return True if any (at least one) or all elements evaluate to True.',
            note: 'Short-circuits immediately once result is determined.'
          }
        ]
      },
      {
        id: 'list_comprehensions',
        name: 'List Comprehensions',
        icon: 'Sparkles',
        items: [
          {
            title: 'Filtered & Transformed Comprehension',
            syntax: '[expr for item in iterable if condition]',
            code: \`# Squares of even numbers:
evens_squared = [x**2 for x in range(10) if x % 2 == 0]
print(evens_squared)  # [0, 4, 16, 36, 64]\`,
            description: 'Construct a new list by applying an expression and optional filter to each item.',
            note: 'Much faster and more concise than traditional for-loop with append.'
          },
          {
            title: 'Ternary If-Else Comprehension',
            syntax: '[val_if if cond else val_else for item in iterable]',
            code: \`# Replace negatives with 0, keep positives:
nums = [-2, 5, -1, 8, 0]
normalized = [x if x > 0 else 0 for x in nums]
print(normalized)  # [0, 5, 0, 8, 0]\`,
            description: 'Apply conditional replacement to list elements using ternary expression.',
            note: 'When using if-else, place it before "for"; when filtering only, place "if" after.'
          },
          {
            title: 'Flatten 2D Matrix to 1D',
            syntax: '[elem for row in matrix for elem in row]',
            code: \`matrix = [[1, 2, 3], [4, 5, 6], [7, 8, 9]]
flat = [elem for row in matrix for elem in row]
print(flat)  # [1, 2, 3, 4, 5, 6, 7, 8, 9]\`,
            description: 'Flatten a nested 2-dimensional list into a single linear list.',
            note: 'The order of for-loops matches the order in standard nested loops.'
          }
        ]
      }
    ]
  },
  Topic3: {
    lectureId: 'Topic3',
    title: 'Topic 3: Tuples, Sets & Dictionaries',
    subtitle: 'Tuples, set operations, dictionary mapping, sorting by key/value, and collections utilities',
    categories: [
      {
        id: 'tuples',
        name: 'Tuples & Variable Unpacking',
        icon: 'Layers',
        items: [
          {
            title: 'Tuple Definition & Immutability',
            syntax: 't = (x, y, ...)',
            code: \`point = (10, 20)
single_item = (42,) # Note trailing comma for 1-item tuple
print(point[0], point[1])\`,
            description: 'Ordered, immutable collection of elements.',
            note: 'Tuples can be used as dictionary keys and set elements because they are hashable.'
          },
          {
            title: 'Variable Swapping via Unpacking',
            syntax: 'a, b = b, a',
            code: \`a = 5
b = 10
a, b = b, a
print(f"a = {a}, b = {b}")  # a = 10, b = 5\`,
            description: 'Swap two variables simultaneously without needing a temporary variable.',
            note: 'Evaluates the right side into a tuple first, then unpacks to left side.'
          }
        ]
      },
      {
        id: 'sets',
        name: 'Sets & Set Operations',
        icon: 'FileCode',
        items: [
          {
            title: 'Deduplicate Elements with Set',
            syntax: 'set(iterable)',
            code: \`raw_ids = [1, 2, 2, 3, 4, 4, 4, 5]
unique_ids = set(raw_ids)
print(unique_ids)  # {1, 2, 3, 4, 5}
# Count distinct elements:
print("Distinct count:", len(unique_ids))\`,
            description: 'Convert collection to set to automatically strip duplicate values.',
            note: 'Sets are unordered. To preserve order while deduplicating, use dict.fromkeys(lst).'
          },
          {
            title: 'Add & Discard Set Elements',
            syntax: 's.add(x), s.discard(x)',
            code: \`tags = {"python", "data"}
tags.add("ai")
tags.discard("web")  # Does not raise error if "web" is not in set
print(tags)\`,
            description: 'Add a new element to set, or safely remove an element if present.',
            note: 'discard(x) is safer than remove(x) because discard never raises KeyError.'
          },
          {
            title: 'Set Operations (Union, Intersect, Diff)',
            syntax: 's1 | s2, s1 & s2, s1 - s2, s1 ^ s2',
            code: \`a = {1, 2, 3, 4}
b = {3, 4, 5, 6}
print("Union (A | B):", a | b)          # {1, 2, 3, 4, 5, 6}
print("Intersection (A & B):", a & b)   # {3, 4}
print("Difference (A - B):", a - b)     # {1, 2}
print("Symmetric Diff (A ^ B):", a ^ b) # {1, 2, 5, 6}\`,
            description: 'Perform standard mathematical set operations.',
            note: 'Equivalent methods: a.union(b), a.intersection(b), a.difference(b).'
          }
        ]
      },
      {
        id: 'dictionaries',
        name: 'Dictionaries & Key-Value Operations',
        icon: 'FileText',
        items: [
          {
            title: 'Safe Retrieval with get()',
            syntax: 'd.get(key, default=None)',
            code: \`user = {"name": "Alex", "age": 22}
city = user.get("city", "Hanoi")  # "Hanoi" (default value)
age = user.get("age", 0)          # 22
print(city, age)\`,
            description: 'Retrieve value for key, returning a fallback default if key is not found.',
            note: 'Prevents KeyError crashes when reading dynamic or optional dictionary fields.'
          },
          {
            title: 'Iterate Keys, Values & Items',
            syntax: 'd.keys(), d.values(), d.items()',
            code: \`prices = {"apple": 15, "banana": 10, "orange": 20}
for item, price in prices.items():
    print(f"{item} costs {price}k")\`,
            description: 'Iterate over dictionary keys, values, or key-value tuple pairs.',
            note: 'In Python 3.7+, dictionaries preserve insertion order.'
          },
          {
            title: 'Sort Dictionary by Value or Key',
            syntax: 'dict(sorted(d.items(), key=lambda item: item[1]))',
            code: \`scores = {"Bob": 85, "Alice": 95, "Charlie": 78}
# Sort ascending by score (value):
by_score = dict(sorted(scores.items(), key=lambda x: x[1]))
print("By score:", by_score)
# Sort descending by score:
top_students = dict(sorted(scores.items(), key=lambda x: x[1], reverse=True))
print("Top students:", top_students)\`,
            description: 'Sort a dictionary by its values or keys using sorted() with lambda key.',
            note: 'item[0] is the key, item[1] is the value.'
          },
          {
            title: 'Dictionary Comprehension',
            syntax: '{k_expr: v_expr for item in iterable if condition}',
            code: \`names = ["alice", "bob", "charlie"]
name_lengths = {name: len(name) for name in names if len(name) > 3}
print(name_lengths)  # {'alice': 5, 'charlie': 7}\`,
            description: 'Construct a dictionary concisely from an iterable.',
            note: 'Can invert a dictionary: {v: k for k, v in original.items()}.'
          }
        ]
      },
      {
        id: 'collections_module',
        name: 'Collections Module (Counter & Defaultdict)',
        icon: 'Sparkles',
        items: [
          {
            title: 'Count Frequency with Counter',
            syntax: 'from collections import Counter',
            code: \`from collections import Counter
items = ["apple", "banana", "apple", "orange", "apple", "banana"]
counts = Counter(items)
print(counts)                   # Counter({'apple': 3, 'banana': 2, 'orange': 1})
print("Apple count:", counts["apple"]) # 3
# Find most common element:
most_common_item = counts.most_common(1)[0][0]
print("Most frequent:", most_common_item)\`,
            description: 'Count element frequencies in a sequence in $O(n)$ time.',
            note: 'counts["non_existent"] returns 0 instead of raising KeyError.'
          },
          {
            title: 'Defaultdict for Grouping',
            syntax: 'from collections import defaultdict',
            code: \`from collections import defaultdict
# Group items by initial letter:
grouped = defaultdict(list)
words = ["cat", "car", "dog", "deer", "bird"]
for w in words:
    grouped[w[0]].append(w)
print(dict(grouped))  # {'c': ['cat', 'car'], 'd': ['dog', 'deer'], 'b': ['bird']}\`,
            description: 'Dictionary that automatically supplies a default value for any missing key.',
            note: 'Pass list, int, or set as factory function: defaultdict(int) acts as counter.'
          }
        ]
      }
    ]
  },
  Topic4: {
    lectureId: 'Topic4',
    title: 'Topic 4: Control Flow, Loops & Functions',
    subtitle: 'Conditional branches, loops, functions, variable arguments, lambda, and recursion',
    categories: [
      {
        id: 'control_flow',
        name: 'Conditionals & Loops',
        icon: 'Layers',
        items: [
          {
            title: 'Ternary Conditional Expression',
            syntax: 'val = a if condition else b',
            code: \`score = 75
status = "Passed" if score >= 50 else "Failed"
print(status)  # "Passed"\`,
            description: 'Compact one-line conditional assignment.',
            note: 'Both if and else branches are mandatory.'
          },
          {
            title: 'Range Loop Variations',
            syntax: 'range(start, stop, step)',
            code: \`# Forward loop: 0 to 4
for i in range(5): pass
# Custom start and step: 10, 8, 6, 4, 2
evens_down = list(range(10, 0, -2))
print(evens_down)  # [10, 8, 6, 4, 2]\`,
            description: 'Generate sequence of numbers with optional start, stop, and step.',
            note: 'Stop is always exclusive. To count down, use a negative step.'
          },
          {
            title: 'Break, Continue & For-Else',
            syntax: 'break, continue, for ... else:',
            code: \`# Check if target exists in list:
target = 7
numbers = [2, 4, 6, 7, 8]
for num in numbers:
    if num == target:
        print("Found target!")
        break
else:
    print("Target not found in list")\`,
            description: 'Break terminates loop, continue skips iteration. Else executes if no break occurred.',
            note: 'for...else is perfect for search loops to detect when no match was found.'
          }
        ]
      },
      {
        id: 'functions',
        name: 'Functions & Arguments',
        icon: 'FileCode',
        items: [
          {
            title: 'Default Parameter Values',
            syntax: 'def func(a, b=default_val):',
            code: \`def greet(name, greeting="Hello"):
    return f"{greeting}, {name}!"

print(greet("Bob"))             # "Hello, Bob!"
print(greet("Alice", "Welcome")) # "Welcome, Alice!"\`,
            description: 'Define functions with optional parameters with default values.',
            note: 'Never use mutable defaults like b=[] or b={}; use b=None instead.'
          },
          {
            title: 'Variable Positional & Keyword Arguments (*args, **kwargs)',
            syntax: 'def func(*args, **kwargs):',
            code: \`def calculate_total(*args, multiplier=1):
    return sum(args) * multiplier

print(calculate_total(10, 20, 30))              # 60
print(calculate_total(10, 20, 30, multiplier=2))# 120\`,
            description: 'Accept any number of positional arguments as a tuple, and keyword arguments as a dict.',
            note: '*args gathers extra positional arguments; **kwargs gathers extra keyword arguments.'
          },
          {
            title: 'Recursion with Base Case',
            syntax: 'def recursive_fn(n): if base: return ... else: return recursive_fn(...)',
            code: \`# Recursive factorial:
def factorial(n):
    if n <= 1:
        return 1
    return n * factorial(n - 1)

print(factorial(5))  # 120\`,
            description: 'Function that calls itself to solve smaller sub-problems until reaching a base condition.',
            note: 'Always ensure the base case is reached to prevent RecursionError.'
          }
        ]
      },
      {
        id: 'lambda_functional',
        name: 'Lambda & Functional Tools',
        icon: 'Sparkles',
        items: [
          {
            title: 'Lambda Anonymous Functions',
            syntax: 'lambda arg1, arg2: expression',
            code: \`square = lambda x: x ** 2
add = lambda a, b: a + b
print(square(6))  # 36
print(add(3, 4))  # 7\`,
            description: 'Create small, inline, anonymous functions with a single expression.',
            note: 'Commonly used as the key argument in sorted(), max(), and min().'
          },
          {
            title: 'Custom Multi-Criteria Sorting Key',
            syntax: 'sorted(lst, key=lambda x: (criterion1, criterion2))',
            code: \`students = [
    {"name": "Bob", "grade": 85, "age": 20},
    {"name": "Alice", "grade": 95, "age": 21},
    {"name": "Charlie", "grade": 85, "age": 19}
]
# Sort by grade descending (-x['grade']), then by age ascending:
sorted_students = sorted(students, key=lambda x: (-x['grade'], x['age']))
for s in sorted_students:
    print(s['name'], s['grade'], s['age'])
# Alice (95), Charlie (85, 19), Bob (85, 20)\`,
            description: 'Sort objects by multiple criteria using a tuple in the lambda key.',
            note: 'Negate numerical values (e.g. -x) to sort that specific criterion in descending order.'
          },
          {
            title: 'Map & Filter Functions',
            syntax: 'map(func, iterable), filter(func, iterable)',
            code: \`nums = [1, 2, 3, 4, 5, 6]
evens = list(filter(lambda x: x % 2 == 0, nums))    # [2, 4, 6]
doubled = list(map(lambda x: x * 2, nums))          # [2, 4, 6, 8, 10, 12]
print(evens, doubled)\`,
            description: 'Filter elements matching a condition or map a transformation over an iterable.',
            note: 'Returns lazy iterators; wrap in list() to realize the results.'
          }
        ]
      }
    ]
  },
  Topic5: {
    lectureId: 'Topic5',
    title: 'Topic 5: Math, Primes & Exam Algorithms',
    subtitle: 'Math utilities, prime checking & sieves, divisors, matrix operations, and interview patterns',
    categories: [
      {
        id: 'math_essentials',
        name: 'Math Module Essentials',
        icon: 'Bookmark',
        items: [
          {
            title: 'Integer Square Root & GCD/LCM',
            syntax: 'math.isqrt(n), math.gcd(a, b), math.lcm(a, b)',
            code: \`import math
print(math.isqrt(17))     # 4 (exact integer square root: floor(sqrt(17)))
print(math.gcd(24, 36))    # 12 (Greatest Common Divisor)
print(math.lcm(24, 36))    # 72 (Least Common Multiple)\`,
            description: 'Fast mathematical functions for exact integer arithmetic and divisors.',
            note: 'isqrt() returns integer directly without precision loss of floating-point sqrt.'
          },
          {
            title: 'Factorial & Combinations (Binomial)',
            syntax: 'math.factorial(n), math.comb(n, k)',
            code: \`import math
print(math.factorial(5))   # 120 (5!)
# Binomial coefficient C(n, k):
ways = math.comb(10, 3)    # 120 (Choose 3 from 10)
print("Ways to choose:", ways)\`,
            description: 'Compute permutations, factorials, and combination choose functions.',
            note: 'math.comb(n, k) computes n! / (k! * (n-k)!) efficiently.'
          }
        ]
      },
      {
        id: 'prime_algorithms',
        name: 'Prime Numbers & Divisors',
        icon: 'FileCode',
        items: [
          {
            title: 'Optimized Prime Check O(sqrt(n))',
            syntax: 'def is_prime(n):',
            code: \`import math

def is_prime(n):
    if n < 2:
        return False
    if n in (2, 3):
        return True
    if n % 2 == 0 or n % 3 == 0:
        return False
    for i in range(5, math.isqrt(n) + 1, 6):
        if n % i == 0 or n % (i + 2) == 0:
            return False
    return True

print([x for x in range(20) if is_prime(x)])
# [2, 3, 5, 7, 11, 13, 17, 19]\`,
            description: 'Check if a positive integer n is a prime number in $O(\\\\sqrt{n})$ time.',
            note: 'Testing up to isqrt(n) is sufficient because factors repeat beyond the square root.'
          },
          {
            title: 'Sieve of Eratosthenes (All Primes <= n)',
            syntax: 'def sieve(n):',
            code: \`def sieve_of_eratosthenes(n):
    is_p = [True] * (n + 1)
    is_p[0] = is_p[1] = False
    for p in range(2, int(n**0.5) + 1):
        if is_p[p]:
            for multiple in range(p * p, n + 1, p):
                is_p[multiple] = False
    return [i for i, prime in enumerate(is_p) if prime]

print(sieve_of_eratosthenes(30))
# [2, 3, 5, 7, 11, 13, 17, 19, 23, 29]\`,
            description: 'Generate all prime numbers up to n in $O(n \\\\log \\\\log n)$ time.',
            note: 'Best algorithm when needing prime checks for multiple queries.'
          },
          {
            title: 'Find All Divisors of Integer',
            syntax: 'def find_divisors(n):',
            code: \`def get_divisors(n):
    divs = []
    for i in range(1, int(n**0.5) + 1):
        if n % i == 0:
            divs.append(i)
            if i * i != n:
                divs.append(n // i)
    return sorted(divs)

print(get_divisors(36))
# [1, 2, 3, 4, 6, 9, 12, 18, 36]\`,
            description: 'Find all positive factors/divisors of integer n in $O(\\\\sqrt{n})$ time.',
            note: 'Useful for perfect number checks, abundance checks, and GCD problems.'
          },
          {
            title: 'Smallest Prime >= n (nearest_prime)',
            syntax: 'def nearest_prime(n):',
            code: \`def nearest_prime(n):
    candidate = max(2, n)
    while not is_prime(candidate):
        candidate += 1
    return candidate

print(nearest_prime(14))  # 17\`,
            description: 'Find the smallest prime number greater than or equal to n.',
            note: 'Frequently appears in Mid-term exam problem sets.'
          }
        ]
      },
      {
        id: 'matrix_exam_patterns',
        name: 'Matrix & Problem Solving Patterns',
        icon: 'Sparkles',
        items: [
          {
            title: 'Matrix Transpose with Zip',
            syntax: 'list(map(list, zip(*matrix)))',
            code: \`matrix = [
    [1, 2, 3],
    [4, 5, 6]
]
transposed = [list(col) for col in zip(*matrix)]
print(transposed)
# [[1, 4], [2, 5], [3, 6]]\`,
            description: 'Transpose a 2D matrix (turn rows into columns) using unpacking and zip.',
            note: 'The *matrix unpacks each row as an argument into zip().'
          },
          {
            title: 'Two Sum Target Lookup O(n)',
            syntax: 'def two_sum(nums, target):',
            code: \`def two_sum(nums, target):
    seen = {} # val -> index
    for i, num in enumerate(nums):
        complement = target - num
        if complement in seen:
            return (seen[complement], i)
        seen[num] = i
    return None

print(two_sum([2, 7, 11, 15], 9))  # (0, 1)\`,
            description: 'Find indices of two numbers that add up to target using a hash map in $O(n)$ time.',
            note: 'Replaces slow $O(n^2)$ nested loops with $O(1)$ dictionary lookups.'
          },
          {
            title: 'Vigenere Cipher Encryption',
            syntax: 'def vigenere(plain, key):',
            code: \`def vigenere_encrypt(plain, key):
    res = []
    k_len = len(key)
    for i, ch in enumerate(plain):
        if ch.isalpha():
            base = ord('A') if ch.isupper() else ord('a')
            shift = ord(key[i % k_len].lower()) - ord('a')
            encrypted = chr((ord(ch) - base + shift) % 26 + base)
            res.append(encrypted)
        else:
            res.append(ch)
    return "".join(res)

print(vigenere_encrypt("HELLO", "KEY"))\`,
            description: 'Encrypt string with polyalphabetic Vigenere cipher shifting letters by key.',
            note: 'Wrap-around is handled with modulo 26 arithmetic.'
          }
        ]
      }
    ]
  }
};
`;

// Insert MIDTERM_CHEATSHEETS before getAllCheatsheetItems
content = content.replace(
  'export function getAllCheatsheetItems() {',
  midtermCheatsheetsCode + '\nexport function getAllCheatsheetItems(term = \'last\') {'
);

// Update getAllCheatsheetItems implementation to accept term and deduplicate
const oldGetAll = `export function getAllCheatsheetItems(term = 'last') {
  const allItems = [];
  Object.values(CHEATSHEETS).forEach(lecture => {
    lecture.categories.forEach(cat => {
      cat.items.forEach(item => {
        allItems.push({
          ...item,
          lectureId: lecture.lectureId,
          lectureTitle: lecture.title,
          categoryId: cat.id,
          categoryName: cat.name,
          categoryIcon: cat.icon,
        });
      });
    });
  });
  return allItems;
}`;

const newGetAll = `export function getAllCheatsheetItems(term = 'last') {
  const source = term === 'mid' ? MIDTERM_CHEATSHEETS : CHEATSHEETS;
  const allItems = [];
  const seenSyntaxes = new Set();

  Object.values(source).forEach(group => {
    group.categories.forEach(cat => {
      cat.items.forEach(item => {
        const normKey = (item.syntax || item.title).trim().toLowerCase();
        if (seenSyntaxes.has(normKey)) return;
        seenSyntaxes.add(normKey);

        allItems.push({
          ...item,
          lectureId: group.lectureId,
          lectureTitle: group.title,
          categoryId: cat.id,
          categoryName: cat.name,
          categoryIcon: cat.icon,
        });
      });
    });
  });
  return allItems;
}`;

content = content.replace(oldGetAll, newGetAll);

fs.writeFileSync(cheatsheetFilePath, content, 'utf8');
console.log('Successfully updated src/data/cheatsheets.js with MIDTERM_CHEATSHEETS!');
