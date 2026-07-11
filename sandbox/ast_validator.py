"""AST-валидатор Python-кода для песочницы.

Проверяет AST-дерево на наличие запрещённых конструкций:
- Опасные вызовы (exec, eval, open, __import__ и т.д.)
- Запрещённые импорты (os, sys, subprocess и т.д.)
- Запрещённые AST-узлы

Исполняется как отдельный процесс, читает код из stdin,
пишет JSON-результат {ok: bool, error?: string} в stdout.
"""

import ast
import json
import sys

# Ограничения сложности кода — запасной рубеж защиты помимо лимитов
# времени выполнения и памяти в песочнице. Предотвращают DoS через
# чрезмерно вложенный/объёмный код ещё на этапе валидации.
MAX_AST_NODES = 3000
MAX_AST_DEPTH = 50

code = sys.stdin.read()

ALLOWED_NODES: set[str] = {
    "Module",
    "Expr", "Constant", "Name", "Load", "Store", "Del",
    "BinOp", "UnaryOp", "BoolOp", "Compare", "IfExp", "NamedExpr",
    "Add", "Sub", "Mult", "Div", "FloorDiv", "Mod", "Pow",
    "LShift", "RShift", "BitOr", "BitXor", "BitAnd",
    "And", "Or", "Not", "Invert",
    "Eq", "NotEq", "Lt", "LtE", "Gt", "GtE", "Is", "IsNot", "In", "NotIn",
    "Assign", "AugAssign", "AnnAssign",
    "For", "While", "Break", "Continue",
    "If", "Pass", "Delete", "Raise", "Assert",
    "Return", "Yield", "YieldFrom",
    "FunctionDef", "arguments", "arg", "Call", "keyword",
    "Lambda", "ClassDef",
    "List", "Tuple", "Set", "Dict",
    "ListComp", "SetComp", "DictComp", "GeneratorExp", "comprehension",
    "Subscript", "Slice", "Attribute",
    "JoinedStr", "FormattedValue",
    "Import", "ImportFrom", "alias",
    "Try", "ExceptHandler",
    "With", "withitem",
    "Starred",
}

ALLOWED_IMPORTS: set[str] = set(json.loads(sys.argv[1])) if len(sys.argv) > 1 else set()

DANGEROUS_CALLS: set[str] = {
    "open", "exec", "eval", "compile", "__import__",
    "getattr", "setattr", "delattr", "hasattr",
    "globals", "locals", "vars", "dir",
    "type", "isinstance", "issubclass", "callable",
    "breakpoint",
}

# Запрещённые имена при обращении как к переменной
BLOCKED_NAMES: set[str] = {
    "__builtins__",
}

# Запрещённые дандер-атрибуты — блокируют обход через цепочку классов
# e.g. ().__class__.__bases__[0].__subclasses__()
BLOCKED_DUNDER_ATTRS: set[str] = {
    "__class__", "__bases__", "__mro__",
    "__subclasses__", "__init_subclass__",
    "__builtins__", "__import__",
    "__loader__", "__spec__",
    "__globals__", "__code__", "__dict__",
    "__getattribute__", "__setattr__", "__delattr__",
    "__qualname__", "__module__",
}

# Запрещённые модули и их атрибуты — блокируют доступ к os.path, sys.path, subprocess.run и т.д.
FORBIDDEN_MODULE_ATTRS: dict[str, set[str]] = {
    "os": {"path", "environ", "system", "popen", "spawn", "fork", "kill", "remove", "rmdir", "mkdir", "rename", "chdir", "getcwd", "listdir", "walk", "stat", "access", "chmod", "chown", "link", "symlink", "readlink", "utime", "times", "wait", "waitpid", "execv", "execve", "execvp", "execvpe", "spawnv", "spawnve", "spawnvp", "spawnvpe", "startfile", "popen", "fdopen", "popen2", "popen3", "popen4", "tmpfile", "tempnam", "tmpnam", "ttyname", "isatty", "ttyname", "ctermid", "device_encoding", "getloadavg", "setpriority", "getpriority", "nice", "times", "uname", "sysconf", "confstr", "fpathconf", "pathconf", "getlogin", "getpid", "getppid", "getuid", "geteuid", "getgid", "getegid", "getgroups", "initgroups", "setuid", "setgid", "seteuid", "setegid", "setreuid", "setregid", "setresuid", "setresgid", "setgroups", "getpgid", "setpgid", "getsid", "setsid", "tcgetpgrp", "tcsetpgrp", "getlogin", "getpass", "getuser", "getenv", "putenv", "unsetenv", "clearenv", "load", "unload", "dlopen", "dlsym", "dlclose", "dlerror", "RTLD_LAZY", "RTLD_NOW", "RTLD_GLOBAL", "RTLD_LOCAL", "RTLD_NODELETE", "RTLD_NOLOAD", "RTLD_DEEPBIND"},
    "sys": {"exit", "exit", "argv", "path", "modules", "stdin", "stdout", "stderr", "settrace", "setprofile", "setrecursionlimit", "getrecursionlimit", "getsizeof", "getrefcount", "getcheckinterval", "setcheckinterval", "getdlopenflags", "setdlopenflags", "getfilesystemencoding", "getfilesystemencodeerrors", "getdefaultencoding", "setdefaultencoding", "getprofile", "gettrace", "getswitchinterval", "setswitchinterval", "getcoroutineorigintrackingdepth", "setcoroutineorigintrackingdepth", "getasyncgenhooks", "setasyncgenhooks", "getcoroutinewrapper", "setcoroutinewrapper", "audit", "addaudithook", "flags", "float_info", "float_repr_style", "hash_info", "int_info", "long_info", "maxsize", "maxunicode", "version", "version_info", "hexversion", "api_version", "platform", "prefix", "exec_prefix", "base_prefix", "base_exec_prefix", "executable", "stdlib_module_names", "builtin_module_names", "version", "copyright", "license", "credits", "ps1", "ps2", "setprofile", "settrace", "getprofile", "gettrace", "setrecursionlimit", "getrecursionlimit", "getsizeof", "getrefcount", "getcheckinterval", "setcheckinterval", "getdlopenflags", "setdlopenflags", "getfilesystemencoding", "getfilesystemencodeerrors", "getdefaultencoding", "setdefaultencoding", "getswitchinterval", "setswitchinterval", "getcoroutineorigintrackingdepth", "setcoroutineorigintrackingdepth", "getasyncgenhooks", "setasyncgenhooks", "getcoroutinewrapper", "setcoroutinewrapper", "audit", "addaudithook", "breakpointhook", "__breakpointhook__", "__displayhook__", "__excepthook__", "__interactivehook__", "__stdin__", "__stdout__", "__stderr__"},
    "subprocess": {"run", "call", "check_call", "check_output", "Popen", "getstatusoutput", "getoutput", "DEVNULL", "PIPE", "STDOUT", "TimeoutExpired", "CalledProcessError", "CompletedProcess", "SubprocessError"},
    "shutil": {"copy", "copy2", "copyfile", "copyfileobj", "copymode", "copystat", "copyfileobj", "move", "rmtree", "make_archive", "unpack_archive", "get_archive_formats", "register_archive_format", "unregister_archive_format", "get_unpack_formats", "register_unpack_format", "unregister_unpack_format", "disk_usage", "which", "chown", "get_terminal_size"},
    "importlib": {"import_module", "reload", "invalidate_caches", "find_loader", "find_spec", "util"},
    "pkgutil": {"get_data", "get_loader", "find_loader", "iter_importers", "iter_modules", "walk_packages", "extend_path", "ImpImporter", "ImpLoader"},
    "runpy": {"run_module", "run_path"},
    "site": {"addsitedir", "getsitepackages", "getusersitepackages", "getuserbase", "main"},
    "ctypes": {"CDLL", "WinDLL", "PyDLL", "cdll", "windll", "pydll", "util", "wintypes"},
    "multiprocessing": {"Process", "Pool", "Queue", "Pipe", "Manager", "Value", "Array", "Lock", "RLock", "Semaphore", "BoundedSemaphore", "Condition", "Event", "Barrier", "Pool", "Manager", "Queue", "Pipe", "Process", "current_process", "active_children", "cpu_count", "freeze_support", "set_start_method", "get_start_method", "get_context", "default_context"},
    "threading": {"Thread", "Lock", "RLock", "Condition", "Semaphore", "BoundedSemaphore", "Event", "Barrier", "Timer", "local", "current_thread", "main_thread", "enumerate", "active_count", "setprofile", "settrace", "get_ident", "stack_size"},
    "socket": {"socket", "create_connection", "getaddrinfo", "getnameinfo", "gethostbyname", "gethostbyname_ex", "gethostname", "getfqdn", "gethostbyaddr", "getprotobyname", "getservbyname", "getservbyport", "socketpair", "fromfd", "inet_aton", "inet_ntoa", "inet_pton", "inet_ntop", "htonl", "htons", "ntohl", "ntohs", "SOMAXCONN", "SO_REUSEADDR", "SO_REUSEPORT", "TCP_NODELAY", "SOCK_STREAM", "SOCK_DGRAM", "SOCK_RAW", "SOCK_RDM", "SOCK_SEQPACKET", "AF_INET", "AF_INET6", "AF_UNIX", "AF_UNSPEC", "IPPROTO_TCP", "IPPROTO_UDP", "IPPROTO_RAW", "SHUT_RD", "SHUT_WR", "SHUT_RDWR"},
    "ssl": {"create_default_context", "SSLContext", "SSLSocket", "SSLSession", "SSLContext", "CERT_NONE", "CERT_OPTIONAL", "CERT_REQUIRED", "PROTOCOL_TLS", "PROTOCOL_TLS_CLIENT", "PROTOCOL_TLS_SERVER", "OPENSSL_VERSION", "OPENSSL_VERSION_INFO", "OPENSSL_VERSION_NUMBER"},
    "urllib.request": {"urlopen", "Request", "urlretrieve", "build_opener", "install_opener", "OpenerDirector", "BaseHandler", "HTTPHandler", "HTTPSHandler", "FTPHandler", "FileHandler", "DataHandler", "ProxyHandler", "HTTPRedirectHandler", "HTTPCookieProcessor", "HTTPBasicAuthHandler", "HTTPDigestAuthHandler", "ProxyBasicAuthHandler", "ProxyDigestAuthHandler", "AbstractHTTPHandler", "AbstractDigestAuthHandler", "AbstractBasicAuthHandler", "HTTPErrorProcessor", "HTTPSHandler", "FTPHandler", "FileHandler", "DataHandler", "ProxyHandler", "CacheFTPHandler", "UnknownHandler", "HTTPDefaultErrorHandler", "HTTPRedirectHandler", "HTTPCookieProcessor", "HTTPBasicAuthHandler", "HTTPDigestAuthHandler", "ProxyBasicAuthHandler", "ProxyDigestAuthHandler"},
    "urllib.parse": {"urlparse", "urlunparse", "urljoin", "urlencode", "parse_qs", "parse_qsl", "quote", "quote_plus", "unquote", "unquote_plus", "urlsplit", "urlunsplit", "urldefrag"},
    "urllib.error": {"URLError", "HTTPError", "ContentTooShortError"},
    "http.client": {"HTTPConnection", "HTTPSConnection", "HTTPResponse", "HTTPMessage", "HTTPException", "NotConnected", "InvalidURL", "UnknownProtocol", "UnknownTransferEncoding", "UnimplementedFileMode", "IncompleteRead", "ImproperConnectionState", "CannotSendRequest", "CannotSendHeader", "ResponseNotReady", "BadStatusLine", "LineTooLong", "RemoteDisconnected", "error", "responses"},
    "ftplib": {"FTP", "FTP_TLS", "error_reply", "error_temp", "error_perm", "error_proto", "all_errors"},
    "poplib": {"POP3", "POP3_SSL", "error_proto"},
    "imaplib": {"IMAP4", "IMAP4_SSL", "IMAP4_stream", "Internaldate2tuple", "Int2AP", "ParseFlags", "Time2Internaldate"},
    "smtplib": {"SMTP", "SMTP_SSL", "SMTPAuthenticationError", "SMTPConnectError", "SMTPDataError", "SMTPExtendedError", "SMTPHeloError", "SMTPNotSupportedError", "SMTPRecipientsRefused", "SMTPSenderRefused", "SMTPServerDisconnected", "SMTPResponseException"},
    "nntplib": {"NNTP", "NNTP_SSL", "NNTPError", "NNTPTemporaryError", "NNTPPermanentError", "NNTPProtocolError", "NNTPDataError"},
    "telnetlib": {"Telnet"},
    "xmlrpc.client": {"ServerProxy", "Fault", "ProtocolError", "MultiCall", "Binary", "DateTime", "loads", "dumps"},
    "xmlrpc.server": {"SimpleXMLRPCServer", "CGIXMLRPCRequestHandler", "SimpleXMLRPCDispatcher", "resolve_dotted_attribute"},
    "sqlite3": {"connect", "Connection", "Cursor", "Row", "Error", "Warning", "DataError", "DatabaseError", "IntegrityError", "ProgrammingError", "OperationalError", "NotSupportedError", "DatabaseError", "InterfaceError", "InternalError", "OperationalError", "ProgrammingError", "IntegrityError", "DataError", "NotSupportedError"},
    "pickle": {"load", "loads", "Unpickler", "Pickler", "HIGHEST_PROTOCOL", "DEFAULT_PROTOCOL", "bytes_types", "encode", "decode"},
    "shelve": {"open", "Shelf", "BsdDBStorage", "DbfilenameShelf"},
    "marshal": {"load", "loads", "dump", "dumps", "version"},
    "types": {"FunctionType", "LambdaType", "GeneratorType", "CoroutineType", "AsyncGeneratorType", "MethodType", "BuiltinFunctionType", "BuiltinMethodType", "ModuleType", "TypeType", "GetSetDescriptorType", "MemberDescriptorType", "WrapperDescriptorType", "MethodWrapperType", "ClassMethodDescriptorType", "EllipsisType", "NotImplementedType", "NoneType", "CellType", "MappingProxyType", "SimpleNamespace", "DynamicClassAttribute", "MethodDescriptorType", "WrapperDescriptorType", "ClassMethodDescriptorType"},
    "inspect": {"getsource", "getsourcefile", "getsourcelines", "getfile", "getmodule", "getmodulename", "ismodule", "isclass", "ismethod", "isfunction", "isgeneratorfunction", "isgenerator", "iscoroutinefunction", "iscoroutine", "isawaitable", "isasyncgenfunction", "isasyncgen", "istraceback", "isframe", "iscode", "isbuiltin", "isroutine", "isabstract", "ismethoddescriptor", "isdatadescriptor", "isgetsetdescriptor", "ismemberdescriptor", "signature", "Signature", "Parameter", "BoundArguments", "get_annotations", "getcomments", "getdoc", "getfile", "getmodule", "getsource", "getsourcefile", "getsourcelines", "getabsfile", "getclasstree", "getargspec", "getfullargspec", "getcallargs", "formatargspec", "formatargvalues", "getmro", "getfile", "getmodule", "getsource", "getsourcefile", "getsourcelines", "isabstract", "isasyncgen", "isasyncgenfunction", "isawaitable", "isbuiltin", "isclass", "iscode", "iscoroutine", "iscoroutinefunction", "isdatadescriptor", "isfunction", "isgenerator", "isgeneratorfunction", "isgetsetdescriptor", "ismemberdescriptor", "ismethod", "ismethoddescriptor", "ismodule", "isroutine", "istraceback", "isbuiltin", "isclass", "iscode", "iscoroutine", "iscoroutinefunction", "isdatadescriptor", "isfunction", "isgenerator", "isgeneratorfunction", "isgetsetdescriptor", "ismemberdescriptor", "ismethod", "ismethoddescriptor", "ismodule", "isroutine", "istraceback"},
    "ast": {"parse", "literal_eval", "fix_missing_locations", "increment_lineno", "copy_location", "get_source_segment", "get_docstring", "NodeVisitor", "NodeTransformer", "dump", "unparse", "Module", "Expr", "Constant", "Name", "Load", "Store", "Del", "BinOp", "UnaryOp", "BoolOp", "Compare", "IfExp", "NamedExpr", "Add", "Sub", "Mult", "Div", "FloorDiv", "Mod", "Pow", "LShift", "RShift", "BitOr", "BitXor", "BitAnd", "And", "Or", "Not", "Invert", "Eq", "NotEq", "Lt", "LtE", "Gt", "GtE", "Is", "IsNot", "In", "NotIn", "Assign", "AugAssign", "AnnAssign", "For", "While", "Break", "Continue", "If", "Pass", "Delete", "Raise", "Assert", "Return", "Yield", "YieldFrom", "FunctionDef", "arguments", "arg", "Call", "keyword", "Lambda", "ClassDef", "List", "Tuple", "Set", "Dict", "ListComp", "SetComp", "DictComp", "GeneratorExp", "comprehension", "Subscript", "Slice", "Attribute", "JoinedStr", "FormattedValue", "Import", "ImportFrom", "alias", "Try", "ExceptHandler", "With", "withitem", "Starred"},
    "code": {"compile_command", "InteractiveInterpreter", "InteractiveConsole", "Interpreter"},
    "codeop": {"compile_command", "compile_command", "Compile", "CommandCompiler"},
    "builtins": {"open", "exec", "eval", "compile", "__import__", "getattr", "setattr", "delattr", "hasattr", "globals", "locals", "vars", "dir", "type", "isinstance", "issubclass", "callable", "breakpoint", "input", "print", "len", "range", "enumerate", "zip", "map", "filter", "sorted", "reversed", "sum", "min", "max", "abs", "round", "id", "hash", "help", "copyright", "license", "credits", "exit", "quit", "setattr", "delattr", "getattr", "hasattr", "object", "property", "staticmethod", "classmethod", "super", "type", "vars", "locals", "globals", "dir", "format", "repr", "ascii", "chr", "ord", "bytes", "bytearray", "memoryview", "complex", "float", "int", "bool", "str", "list", "tuple", "set", "frozenset", "dict", "slice", "property", "classmethod", "staticmethod", "super", "type", "object", "Ellipsis", "NotImplemented", "None", "True", "False", "__debug__", "__build_class__", "__import__", "__loader__", "__spec__", "__name__", "__package__", "__annotations__", "__doc__", "__file__", "__cached__", "__path__", "__loader__", "__spec__", "__name__", "__package__", "__annotations__", "__doc__", "__file__", "__cached__", "__path__"},
}

try:
    tree = ast.parse(code)
except SyntaxError as e:
    print(json.dumps({"ok": False, "error": "SyntaxError: " + str(e)}))
    sys.exit(0)

errors: list[str] = []


def _max_depth(node: ast.AST, level: int = 0) -> int:
    child_depths = [level]
    for child in ast.iter_child_nodes(node):
        child_depths.append(_max_depth(child, level + 1))
    return max(child_depths)


class SafeVisitor(ast.NodeVisitor):
    """Обходит AST-дерево и проверяет каждый узел на безопасность."""

    def generic_visit(self, node: ast.AST) -> None:
        node_type = type(node).__name__
        if node_type == "Module":
            super().generic_visit(node)
            return
        if node_type not in ALLOWED_NODES:
            errors.append(f"Forbidden construct: {node_type} (line~{getattr(node, 'lineno', '?')})")
        super().generic_visit(node)

    def visit_Name(self, node: ast.Name) -> None:
        if node.id in BLOCKED_NAMES:
            errors.append(
                f"Forbidden name access: {node.id} "
                f"(line {node.lineno})"
            )
        self.generic_visit(node)

    def visit_Call(self, node: ast.Call) -> None:
        if isinstance(node.func, ast.Name):
            if node.func.id in DANGEROUS_CALLS:
                errors.append(f"Forbidden function call: {node.func.id}() (line {node.lineno})")
        elif isinstance(node.func, ast.Attribute):
            if isinstance(node.func.value, ast.Name):
                if node.func.value.id in ("os", "sys", "subprocess"):
                    errors.append(f"Forbidden module access: {node.func.value.id}.{node.func.attr} (line {node.lineno})")
        self.generic_visit(node)

    def visit_Attribute(self, node: ast.Attribute) -> None:
        if node.attr in BLOCKED_DUNDER_ATTRS:
            errors.append(
                f"Forbidden attribute access: .{node.attr} "
                f"(line {node.lineno})"
            )
        # Check for forbidden module attribute access (e.g., os.path.join, sys.exit, subprocess.run)
        if isinstance(node.value, ast.Name):
            module_name = node.value.id
            if module_name in FORBIDDEN_MODULE_ATTRS and node.attr in FORBIDDEN_MODULE_ATTRS[module_name]:
                errors.append(f"Forbidden module attribute access: {module_name}.{node.attr} (line {node.lineno})")
        self.generic_visit(node)

    def visit_Import(self, node: ast.Import) -> None:
        for alias in node.names:
            if alias.name not in ALLOWED_IMPORTS:
                errors.append(f"Forbidden import: {alias.name} (line {node.lineno})")
        self.generic_visit(node)

    def visit_ImportFrom(self, node: ast.ImportFrom) -> None:
        if node.module and node.module not in ALLOWED_IMPORTS:
            errors.append(f"Forbidden import from: {node.module} (line {node.lineno})")
        self.generic_visit(node)


visitor = SafeVisitor()
visitor.visit(tree)

# ─── Ограничения сложности ───
node_count = sum(1 for _ in ast.walk(tree))
if node_count > MAX_AST_NODES:
    errors.append(f"Code too complex: too many AST nodes ({node_count} > {MAX_AST_NODES})")
if _max_depth(tree) > MAX_AST_DEPTH:
    errors.append(f"Code too complex: nesting depth exceeds {MAX_AST_DEPTH}")

if errors:
    print(json.dumps({"ok": False, "error": "; ".join(errors[:3])}))
else:
    print(json.dumps({"ok": True}))
