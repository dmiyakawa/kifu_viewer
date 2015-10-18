# これは？

Electronを使った単体アプリ棋譜ビューア。CORSもなんのその。

# 必要なもの

* [Kifu-for-JS](https://github.com/na2hiro/Kifu-for-JS)
* [Electron](http://electron.atom.io/)
* 棋譜 (Kifu-for-JSが対応しているフォーマット、KIF, KI2, CSA, JKF形式など)
   * Kifu-for-JS側実装の関係で jkf, kifu, ki2u はUTF-8、その他はShift_JISエンコーディングが採用されます。多分業界標準です。

# ライセンス

本体ソースコードはMIT。
付属してるOSSソースはそっちのライセンス。

# 使い方

```
$ electron .
```
