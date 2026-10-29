// Ghi chú bàn giao backend:
// Bản HTML tĩnh chỉ có một trang product-category.html, nên module này đọc ?category= trên URL
// và lấy dữ liệu trong <script class="categoryDataJS"> để đổi ảnh banner, H1, mục cuối breadcrumb,
// <title> và class current-menu-item / current-menu-parent / current-menu-ancestor của menu,
// giống cách WordPress tự gắn khi xem một danh mục product_cat. "Hàng Tết" là trang template, không phải danh mục.
// Khi làm WordPress: trang danh mục là taxonomy-product_cat (term hiện tại từ get_queried_object()),
// menu do wp_nav_menu() tự gắn class current-*; bỏ module này, khối JSON categoryDataJS
// và các class categoryImageJS / categoryNameJS.
// Slug không có trong danh sách (hoặc không có ?category=) thì giữ nguyên nội dung mặc định (Nước ép trái cây).

export default function CategoryPageModule() {
  const source = document.querySelector(".categoryDataJS");
  if (!source) return;

  const slug = new URLSearchParams(window.location.search).get("category")?.trim();
  if (!slug) return;

  let categories = [];
  try {
    categories = JSON.parse(source.textContent);
  } catch (error) {
    console.error("categoryDataJS is not valid JSON", error);
    return;
  }

  const category = categories.find((item) => item.slug === slug);
  if (!category) return;

  const image = document.querySelector(".categoryImageJS");
  if (image) {
    image.src = category.image;
    image.alt = category.alt;
    image.width = category.width;
    image.height = category.height;
  }

  const names = document.querySelectorAll(".categoryNameJS");
  const defaultName = names[0]?.textContent.trim();
  names.forEach((el) => {
    el.textContent = category.name;
  });
  if (defaultName) document.title = document.title.replace(defaultName, category.name);

  document.querySelectorAll('.primary-menu a[href*="product-category.html"], .mobile-menu a[href*="product-category.html"]').forEach((link) => {
    const isCurrent = new URL(link.href, window.location.href).searchParams.get("category") === category.slug;
    link.toggleAttribute("aria-current", isCurrent);
    if (isCurrent) link.setAttribute("aria-current", "page");
    link.closest(".menu-item")?.classList.toggle("current-menu-item", isCurrent);
  });

  document.querySelectorAll(":is(.primary-menu, .mobile-menu) > .menu-item-has-children").forEach((item) => {
    const hasCurrent = Boolean(item.querySelector(".sub-menu .current-menu-item"));
    item.classList.toggle("current-menu-parent", hasCurrent);
    item.classList.toggle("current-menu-ancestor", hasCurrent);
  });
}
