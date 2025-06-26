def update_opposite_in_file(original, opposite, newOpposite, filename='XwhenYwalksin.txt'):
    """
    For each line in the file, split by spaces. If 'original' appears before 'opposite', replace 'opposite' with 'newOpposite'.
    Print the line number and the change to the console.
    """
    updated_lines = []
    with open(filename, 'r', encoding='utf-8') as f:
        for idx, line in enumerate(f, 1):  # idx is 1-based
            parts = line.rstrip('\n').split(' ')
            old_line = ' '.join(parts)
            changed = False
            try:
                orig_idx = parts.index(original)
                opp_idx = parts.index(opposite)
                if orig_idx < opp_idx:
                    parts[opp_idx] = newOpposite
                    changed = True
            except ValueError:
                # original or opposite not in this line
                pass
            new_line = ' '.join(parts)
            if changed:
                print(f"Line {idx}: {old_line} -> {new_line}")
            updated_lines.append(new_line)
    with open(filename, 'w', encoding='utf-8') as f:
        for line in updated_lines:
            f.write(line + '\n')

def process_related_lists(filename='XwhenYwalksin.txt'):
    """
    For each line in the file, split by '->', then split the second and third elements by spaces.
    This yields two lists of equal length. Print both lists for each line.
    """

    dictionary = {}
    with open(filename, 'r', encoding='utf-8') as f:
        for idx, line in enumerate(f, 1):
            parts = [p.strip() for p in line.rstrip('\n').split(' -> ')]
            if len(parts) < 3:
                continue  # skip malformed lines
            list1 = parts[1].split(' ')
            list2 = parts[2].split(' ')
            if len(list1) != len(list2):
                print(f"Line {idx}: Length mismatch: {list1} vs {list2}")
            else:
                for i in range(len(list1)):
                    if list1[i] in dictionary and dictionary[list1[i]] != list2[i]:
                        print(f"Line {idx}: {list1[i]} -> {list2[i]}")
                    dictionary[list1[i]] = list2[i]
    return dictionary

update_opposite_in_file('side', 'top', 'entree')



with open('opposite.txt', 'w', encoding='utf-8') as f:
    output = process_related_lists()
    for key, value in output.items():
        f.write(f"{key} , {value} , \n")



